import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ─── CREATE ORDER ─────────────────────────────────────────
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, eventId, seatIds } = req.body;
    const userId = req.userId;

    if (!amount || !eventId || !seatIds) {
      res.status(400).json({ message: 'Amount, eventId and seatIds are required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Please login to continue' });
      return;
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses paise (1 INR = 100 paise)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId,
        userId,
        seatIds: JSON.stringify(seatIds),
      },
    });

    res.status(200).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// ─── VERIFY PAYMENT ───────────────────────────────────────
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      seatIds,
    } = req.body;

    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Please login to continue' });
      return;
    }

    // Step 1 — Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ message: 'Payment verification failed' });
      return;
    }

    // Step 2 — Mark seats as booked
    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { isBooked: true },
    });

    // Step 3 — Get seats for total
    const seats = await prisma.seat.findMany({
      where: { id: { in: seatIds } },
    });
    const total = seats.reduce((sum, seat) => sum + seat.price, 0);

    // Step 4 — Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        eventId,
        seatIds,
        total,
        status: 'confirmed',
        paymentId: razorpay_payment_id,
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

    // Step 5 — Remove Redis locks
    const redisClient = (await import('../lib/redis')).default;
    for (const seatId of seatIds) {
      await redisClient.del(`seat_lock:${eventId}:${seatId}`);
    }

    // Step 6 — Track activity
    await prisma.activity.create({
      data: {
        userId,
        eventId,
        action: 'booked',
      },
    });

    res.status(201).json({
      message: 'Payment verified and booking confirmed!',
      booking,
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};