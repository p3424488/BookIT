import { Router } from 'express';
import {
  addReview,
  getEventReviews,
  getMyReviews,
  deleteReview,
} from '../controllers/review';
import { protect } from '../middleware/auth';

const router = Router();

// POST /api/reviews
router.post('/', protect, addReview);

// GET /api/reviews/event/:id
router.get('/event/:id', getEventReviews);

// GET /api/reviews/my
router.get('/my', protect, getMyReviews);

// DELETE /api/reviews/:id
router.delete('/:id', protect, deleteReview);

export default router;