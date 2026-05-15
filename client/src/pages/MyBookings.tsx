import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyBookings, cancelBooking } from '../api/booking';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/helpers';
import { useState } from 'react';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
    enabled: isLoggedIn,
  });

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
        <div className="text-center">
          <p className="text-4xl mb-3">🎟️</p>
          <h2 className="text-lg font-semibold text-white mb-2">
            Login to view tickets
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Your booking history will appear here
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

const handleCancel = async (bookingId: string) => {
  if (!window.confirm('Are you sure you want to cancel this booking?')) return;
  setCancelling(bookingId);
  try {
    await cancelBooking(bookingId);
    await refetch();
    window.alert('Booking cancelled successfully!');
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      window.alert(axiosErr.response?.data?.message || 'Failed to cancel booking');
    } else {
      window.alert('Failed to cancel booking. Please try again.');
    }
  } finally {
    setCancelling(null);
  }
};

  const getStatusColor = (status: string) => {
    if (status === 'confirmed') return 'bg-green-50 text-green-700 border border-green-100';
    if (status === 'cancelled') return 'bg-red-50 text-red-600 border border-red-100';
    return 'bg-yellow-50 text-yellow-700 border border-yellow-100';
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>

      {/* Header */}
      <div
  className="py-8 relative overflow-hidden"
  style={{
    backgroundImage: 'url(https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1400&q=80)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }}
>
  <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-black/70" />
  <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-2xl font-semibold text-white mb-1">
            My Tickets 🎟️
          </h1>
          <p className="text-gray-400 text-sm">
            All your bookings in one place
          </p>
        </div>
      </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : data?.bookings && data.bookings.length > 0 ? (
          <div className="space-y-4">
            {data.bookings.map((booking) => (
              <div
  key={booking.id}
  className="rounded-2xl overflow-hidden"
  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
>
                {/* Top section */}
                <div className="p-5 flex gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e, #302b63)' }}
                  >
                    🎬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white text-sm">
                        {booking.event.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
  📍 {booking.event.venue}, {booking.event.city}
</p>
<p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
  🗓️ {formatDate(booking.event.dateTime)}
</p>
                  </div>
                </div>

                {/* Bottom section */}
                <div className="px-5 pb-5 flex items-center justify-between pt-3"
style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {booking.seatIds.length} seat{booking.seatIds.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-base font-semibold text-primary">
                      ₹{booking.total}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="text-xs text-red-500 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/events/${booking.eventId}`)}
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      View Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🎟️</p>
           <p style={{ color: 'rgba(255,255,255,0.4)' }}>No bookings yet</p>
<p className="text-sm mt-1 mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Book your first event to see it here
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-medium"
            >
              Browse Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;