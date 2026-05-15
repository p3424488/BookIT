import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/payment';
import { protect } from '../middleware/auth';

const router = Router();

// POST /api/payments/create-order
router.post('/create-order', protect, createOrder);

// POST /api/payments/verify
router.post('/verify', protect, verifyPayment);

export default router;