import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import eventsRoutes from './routes/events';
import bookingRoutes from './routes/booking';
import reviewRoutes from './routes/review';
import searchRoutes from './routes/search';
import paymentRoutes from './routes/payment';
import recommendationRoutes from './routes/recommendations';
import { connectRedis } from './lib/redis';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BookIt server is running!',
  });
});

// Socket.io events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins an event room
  socket.on('join_event', (eventId: string) => {
    socket.join(`event_${eventId}`);
    const room = io.sockets.adapter.rooms.get(`event_${eventId}`);
    const viewerCount = room ? room.size : 0;

    // Tell everyone in this room how many viewers
    io.to(`event_${eventId}`).emit('viewer_count', {
      eventId,
      count: viewerCount,
    });

    console.log(`User joined event room: ${eventId} (${viewerCount} viewers)`);
  });

  // User leaves an event room
  socket.on('leave_event', (eventId: string) => {
    socket.leave(`event_${eventId}`);
    const room = io.sockets.adapter.rooms.get(`event_${eventId}`);
    const viewerCount = room ? room.size : 0;

    io.to(`event_${eventId}`).emit('viewer_count', {
      eventId,
      count: viewerCount,
    });
  });

  // User selects a seat — lock it for everyone
  socket.on('lock_seat', (data: { eventId: string; seatId: string; userId: string }) => {
    socket.to(`event_${data.eventId}`).emit('seat_locked', {
      seatId: data.seatId,
      lockedBy: data.userId,
    });
    console.log(`Seat locked: ${data.seatId} in event ${data.eventId}`);
  });

  // User deselects a seat — unlock it for everyone
  socket.on('unlock_seat', (data: { eventId: string; seatId: string }) => {
    socket.to(`event_${data.eventId}`).emit('seat_unlocked', {
      seatId: data.seatId,
    });
    console.log(`Seat unlocked: ${data.seatId} in event ${data.eventId}`);
  });

  // Booking confirmed — mark seats as permanently booked
  socket.on('booking_confirmed', (data: { eventId: string; seatIds: string[] }) => {
    io.to(`event_${data.eventId}`).emit('seats_booked', {
      seatIds: data.seatIds,
    });
    console.log(`Booking confirmed for event ${data.eventId}`);
  });

  // User disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start server
const startServer = async () => {
  try {
    await connectRedis();
  } catch (error) {
    console.log('Starting server without Redis...');
  }
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io ready`);
  });
};

startServer();

export default app;