import { Router } from 'express';
import {
  searchEvents,
  getCategories,
} from '../controllers/search';

const router = Router();

// GET /api/search?q=dune
router.get('/', searchEvents);

// GET /api/search/filters
router.get('/filters', getCategories);

export default router;