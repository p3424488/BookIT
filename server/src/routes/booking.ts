import { Router } from 'express';
import {
  lockSeats,
  confirmBooking,
  getMyBookings,
  cancelBooking,
} from '../controllers/booking';
import { protect } from '../middleware/auth';

const router = Router();

// POST /api/bookings/lock
router.post('/lock', protect, lockSeats);

// POST /api/bookings/confirm
router.post('/confirm', protect, confirmBooking);

// GET /api/bookings/my
router.get('/my', protect, getMyBookings);

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', protect, cancelBooking);

export default router;