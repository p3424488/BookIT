import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  getEventSeats,
} from '../controllers/events';

const router = Router();

// GET /api/events
router.get('/', getAllEvents);

// GET /api/events/:id
router.get('/:id', getEventById);

// POST /api/events
router.post('/', createEvent);

// GET /api/events/:id/seats
router.get('/:id/seats', getEventSeats);

export default router;