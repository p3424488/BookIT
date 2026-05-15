import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getEventById, getEventSeats } from '../api/events';
import { lockSeats, createPaymentOrder, verifyPayment } from '../api/booking';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, formatDuration, getCategoryEmoji, getCategoryColor } from '../utils/helpers';
import { socket, connectSocket, disconnectSocket } from '../lib/socket';
import type { Seat } from '../types/index';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();

  // State
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [lockedByOthers, setLockedByOthers] = useState<string[]>([]);
  const socketInitialized = useRef(false);

  // Fetch event
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  });

  // Fetch seats
  const { data: seatsData, isLoading: seatsLoading, refetch: refetchSeats } = useQuery({
    queryKey: ['seats', id],
    queryFn: () => getEventSeats(id!),
    enabled: !!id,
  });

  const event = eventData?.event;
  const seats = seatsData?.seats || [];

  // Socket.io setup
  useEffect(() => {
    if (!id || socketInitialized.current) return;
    socketInitialized.current = true;

    connectSocket();
    socket.emit('join_event', id);

    socket.on('viewer_count', (data: { eventId: string; count: number }) => {
      if (data.eventId === id) setViewerCount(data.count);
    });

    socket.on('seat_locked', (data: { seatId: string }) => {
      setLockedByOthers(prev => [...prev, data.seatId]);
    });

    socket.on('seat_unlocked', (data: { seatId: string }) => {
      setLockedByOthers(prev => prev.filter(s => s !== data.seatId));
    });

    socket.on('seats_booked', () => {
      refetchSeats();    });

    return () => {
      socket.emit('leave_event', id);
      socket.off('viewer_count');
      socket.off('seat_locked');
      socket.off('seat_unlocked');
      socket.off('seats_booked');
      disconnectSocket();
      socketInitialized.current = false;
    };
  }, [id]);

  // Toggle seat selection
  const toggleSeat = (seatId: string, isBooked: boolean) => {
    if (isBooked) return;
    if (lockedByOthers.includes(seatId)) return;

    const isCurrentlySelected = selectedSeats.includes(seatId);

    setSelectedSeats(prev =>
      isCurrentlySelected
        ? prev.filter(s => s !== seatId)
        : [...prev, seatId]
    );

    if (isCurrentlySelected) {
      socket.emit('unlock_seat', { eventId: id, seatId });
    } else {
      socket.emit('lock_seat', { eventId: id, seatId, userId: 'current-user' });
    }
  };

  // Seat color based on status
  const getSeatColor = (seat: Seat) => {
    if (seat.isBooked) return 'opacity-50 cursor-not-allowed' ;
    if (selectedSeats.includes(seat.id)) return 'bg-primary text-white border-primary';
    if (lockedByOthers.includes(seat.id)) return 'bg-orange-500 text-white cursor-not-allowed opacity-70';
    if (seat.category === 'Gold') return 'border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white cursor-pointer';
    if (seat.category === 'Silver') return 'border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white cursor-pointer';
    return 'border border-green-500 text-green-400 hover:bg-green-500 hover:text-white cursor-pointer';
  };

  // Calculate total
  const totalPrice = seats
    .filter(s => selectedSeats.includes(s.id))
    .reduce((sum, s) => sum + s.price, 0);

  // Handle booking
  const handleBooking = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (selectedSeats.length === 0) { setError('Please select at least one seat'); return; }

    setBooking(true);
    setError('');

    try {
      // Step 1 — Lock seats in Redis
      await lockSeats({ eventId: id!, seatIds: selectedSeats });

      // Step 2 — Create Razorpay order
      const { order, key } = await createPaymentOrder({
        amount: totalPrice,
        eventId: id!,
        seatIds: selectedSeats,
      });

      // Step 3 — Open Razorpay popup
      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'BookIt',
        description: event?.title,
        order_id: order.id,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId: id!,
              seatIds: selectedSeats,
            });

            // Emit to all users in this event room
            socket.emit('booking_confirmed', {
              eventId: id,
              seatIds: selectedSeats,
            });

            setBookingSuccess(true);
            setSelectedSeats([]);
            refetchSeats();
          } catch {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setBooking(false);
          }
        },
        prefill: {
          name: 'Pavan Kumar',
          email: 'pavan@example.com',
        },
        theme: { color: '#E24B4A' },
        modal: {
          ondismiss: () => {
            setBooking(false);
            setError('Payment cancelled. Your seats are held for 15 minutes.');
          },
        },
      };

      const razorpay = new (window as unknown as {
        Razorpay: new (options: unknown) => { open: () => void };
      }).Razorpay(options);
      razorpay.open();

    } catch (err: unknown) {
      setBooking(false);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Something went wrong');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  // Loading state
  if (eventLoading) return <LoadingSpinner />;
  if (!event) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Event not found</p>
    </div>
  );

  // Booking success screen
  if (bookingSuccess) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
      <div className="rounded-2xl p-10 text-center max-w-md w-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(29,158,117,0.2)' }}>
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Booking Confirmed!</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your tickets for {event.title} are confirmed. Check your bookings for details.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/my-bookings')}
            className="flex-1 bg-primary text-white py-3 rounded-xl text-sm font-medium"
          >
            View Tickets
          </button>
          <button
            onClick={() => setBookingSuccess(false)}
            className="flex-1 py-3 rounded-xl text-sm"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          >
            Book More
          </button>
        </div>
      </div>
    </div>
  );

  const rows = [...new Set(seats.map(s => s.row))].sort();

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>

      {/* Event Header */}
      <div
        className="relative py-10"
        style={{
          backgroundImage: `url(${
            event.category === 'Movie'
              ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1400&q=80'
              : event.category === 'Concert'
              ? 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1400&q=80'
              : 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=1400&q=80'
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.95), rgba(0,0,0,0.7))' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm mb-4 flex items-center gap-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            ← Back
          </button>
          <div className="flex gap-6 items-start">
            <div
              className="w-20 h-24 rounded-xl flex items-center justify-center text-4xl flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              {getCategoryEmoji(event.category)}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              <h1 className="text-2xl font-semibold text-white mt-2 mb-1">
                {event.title}
              </h1>
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                📍 {event.venue}, {event.city}
              </p>
              <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                🗓️ {formatDate(event.dateTime)}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                ⏱️ {formatDuration(event.durationMins)}
                {event.language && ` · 🗣️ ${event.language}`}
              </p>

              {/* Live viewer count */}
              {viewerCount > 1 && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs mt-3"
                  style={{ background: 'rgba(226,75,74,0.15)', border: '1px solid rgba(226,75,74,0.3)', color: '#E24B4A' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {viewerCount} people viewing this event
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Seat map */}
          <div className="md:col-span-2">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-base font-semibold text-white mb-4">
                Select seats
              </h2>

              {/* Screen */}
              <div className="text-center mb-6">
                <div
                  className="inline-block text-xs px-8 py-1.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                >
                  SCREEN
                </div>
              </div>

              {/* Seats grid */}
              {seatsLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="space-y-2">
                  {rows.map(row => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="text-xs w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {row}
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {seats
                          .filter(s => s.row === row)
                          .sort((a, b) => a.column - b.column)
                          .map(seat => (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat.id, seat.isBooked)}
                              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${getSeatColor(seat)}`}
                              style={seat.isBooked ? { background: 'rgba(255,255,255,0.1)' } : {}}
                            >
                              {seat.column}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-yellow-500"></div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Gold ₹450</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-blue-500"></div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Silver ₹350</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded border border-green-500"></div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Bronze ₹250</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-orange-500 opacity-70"></div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Held by others</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Booked</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="rounded-2xl p-5 mt-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-base font-semibold text-white mb-3">About</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {event.description}
              </p>
            </div>
          </div>

          {/* Booking summary */}
          <div className="md:col-span-1">
            <div className="rounded-2xl p-5 sticky top-20" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-base font-semibold text-white mb-4">
                Booking summary
              </h2>

              {selectedSeats.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Select seats to continue
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {seats
                      .filter(s => selectedSeats.includes(s.id))
                      .map(seat => (
                        <div key={seat.id} className="flex justify-between text-sm">
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                            Seat {seat.row}{seat.column} ({seat.category})
                          </span>
                          <span className="font-medium text-white">₹{seat.price}</span>
                        </div>
                      ))}
                  </div>
                  <div className="pt-3 mb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-white">Total</span>
                      <span className="text-base font-semibold text-primary">₹{totalPrice}</span>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.2)', color: '#E24B4A' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleBooking}
                disabled={booking || selectedSeats.length === 0}
                className="w-full bg-primary text-white py-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking
                  ? 'Processing...'
                  : !isLoggedIn
                  ? 'Login to Book'
                  : selectedSeats.length === 0
                  ? 'Select Seats'
                  : `Pay ₹${totalPrice}`}
              </button>

              {!isLoggedIn && (
                <p className="text-xs text-center mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  You need to login to book tickets
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;