import { Router } from 'express';
import {
  getRecommendations,
  getSimilarEvents,
} from '../controllers/recommendations';
import { protect } from '../middleware/auth';

const router = Router();

// GET /api/recommendations
router.get('/', protect, getRecommendations);

// GET /api/recommendations/similar/:id
router.get('/similar/:id', getSimilarEvents);

export default router;