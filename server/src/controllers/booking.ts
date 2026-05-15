import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import redisClient from '../lib/redis';
import { AuthRequest } from '../middleware/auth';
import { LockSeatsInput, ConfirmBookingInput } from '../types/index';

// ─── LOCK SEATS ──────────────────────────────────────────
export const lockSeats = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, seatIds }: LockSeatsInput = req.body;
    const userId = req.userId;

    // Step 1 — Check required fields
    if (!eventId || !seatIds || seatIds.length === 0) {
      res.status(400).json({ message: 'EventId and seatIds are required' });
      return;
    }

    // Step 2 — Check user is logged in
    if (!userId) {
      res.status(401).json({ message: 'Please login to book seats' });
      return;
    }

    // Step 3 — Check if seats exist and are available
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        eventId,
      },
    });

    if (seats.length !== seatIds.length) {
      res.status(400).json({ message: 'One or more seats not found' });
      return;
    }

    // Step 4 — Check if any seat is already booked
    const bookedSeats = seats.filter(s => s.isBooked);
    if (bookedSeats.length > 0) {
      res.status(400).json({
        message: 'One or more seats are already booked',
        bookedSeats: bookedSeats.map(s => `${s.row}${s.column}`),
      });
      return;
    }

    // Step 5 — Check if seats are locked by someone else in Redis
    const lockedByOthers = [];
    for (const seatId of seatIds) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;
      const lockedBy = await redisClient.get(lockKey);
      if (lockedBy && lockedBy !== userId) {
        lockedByOthers.push(seatId);
      }
    }

    if (lockedByOthers.length > 0) {
      res.status(400).json({
        message: 'One or more seats are temporarily held by another user',
        lockedSeats: lockedByOthers,
      });
      return;
    }

    // Step 6 — Lock seats in Redis for 15 minutes
    const LOCK_DURATION = 15 * 60; // 15 minutes in seconds
    for (const seatId of seatIds) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;
      await redisClient.setEx(lockKey, LOCK_DURATION, userId);
    }

    // Step 7 — Calculate total price
    const total = seats.reduce((sum, seat) => sum + seat.price, 0);

    res.status(200).json({
      message: 'Seats locked successfully for 15 minutes',
      eventId,
      lockedSeats: seats.map(s => ({
        id: s.id,
        row: s.row,
        column: s.column,
        category: s.category,
        price: s.price,
      })),
      total,
      expiresIn: '15 minutes',
    });

  } catch (error) {
    console.error('Lock seats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── CONFIRM BOOKING ─────────────────────────────────────
export const confirmBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, seatIds, paymentId }: ConfirmBookingInput = req.body;
    const userId = req.userId;

    // Step 1 — Check required fields
    if (!eventId || !seatIds || seatIds.length === 0) {
      res.status(400).json({ message: 'EventId and seatIds are required' });
      return;
    }

    // Step 2 — Check user is logged in
    if (!userId) {
      res.status(401).json({ message: 'Please login to book seats' });
      return;
    }

    // Step 3 — Verify seats are locked by this user in Redis
    for (const seatId of seatIds) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;
      const lockedBy = await redisClient.get(lockKey);

      if (!lockedBy) {
        res.status(400).json({
          message: 'Seat lock expired. Please select seats again.',
        });
        return;
      }

      if (lockedBy !== userId) {
        res.status(400).json({
          message: 'These seats are not locked by you.',
        });
        return;
      }
    }

    // Step 4 — Get seats and calculate total
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seatIds },
        eventId,
      },
    });

    const total = seats.reduce((sum, seat) => sum + seat.price, 0);

    // Step 5 — Mark seats as booked in database
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { isBooked: true },
    });

    // Step 6 — Create booking record
    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId,
        seatIds,
        total,
        status: 'confirmed',
        paymentId: paymentId || null,
      },
      include: {
        event: {
          select: {
            title: true,
            venue: true,
            city: true,
            dateTime: true,
          },
        },
      },
    });

    // Step 7 — Remove locks from Redis
    for (const seatId of seatIds) {
      const lockKey = `seat_lock:${eventId}:${seatId}`;
      await redisClient.del(lockKey);
    }

    // Step 8 — Track activity
    await prisma.activity.create({
      data: {
        userId,
        eventId,
        action: 'booked',
      },
    });

    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: {
        id: booking.id,
        event: booking.event,
        seats: seats.map(s => ({
          row: s.row,
          column: s.column,
          category: s.category,
          price: s.price,
        })),
        total,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });

  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── MY BOOKINGS ─────────────────────────────────────────
export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Please login to view bookings' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            title: true,
            category: true,
            venue: true,
            city: true,
            dateTime: true,
            posterUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      message: 'Bookings fetched successfully',
      count: bookings.length,
      bookings,
    });

  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── CANCEL BOOKING ──────────────────────────────────────
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Please login to cancel booking' });
      return;
    }

    // Step 1 — Find booking
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Step 2 — Check booking belongs to this user
    if (booking.userId !== userId) {
      res.status(403).json({ message: 'Not authorized to cancel this booking' });
      return;
    }

    // Step 3 — Check booking is not already cancelled
    if (booking.status === 'cancelled') {
      res.status(400).json({ message: 'Booking is already cancelled' });
      return;
    }

    // Step 4 — Release seats back to available
    await prisma.seat.updateMany({
      where: { id: { in: booking.seatIds } },
      data: { isBooked: false },
    });

    // Step 5 — Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};