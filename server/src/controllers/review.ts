import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { CreateReviewInput } from '../types/index';

// ─── ADD REVIEW ──────────────────────────────────────────
export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, rating, comment }: CreateReviewInput = req.body;
    const userId = req.userId;

    // Step 1 — Check required fields
    if (!eventId || !rating) {
      res.status(400).json({ message: 'EventId and rating are required' });
      return;
    }

    // Step 2 — Check rating is between 1 and 5
    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    // Step 3 — Check user is logged in
    if (!userId) {
      res.status(401).json({ message: 'Please login to add a review' });
      return;
    }

    // Step 4 — Check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Step 5 — Check user hasn't already reviewed this event
    const existingReview = await prisma.review.findFirst({
      where: { userId, eventId },
    });

    if (existingReview) {
      res.status(400).json({ 
        message: 'You have already reviewed this event' 
      });
      return;
    }

    // Step 6 — Check user has booked this event
    const booking = await prisma.booking.findFirst({
      where: {
        userId,
        eventId,
        status: 'confirmed',
      },
    });

    if (!booking) {
      res.status(400).json({ 
        message: 'You can only review events you have attended' 
      });
      return;
    }

    // Step 7 — Create review
    const review = await prisma.review.create({
      data: {
        userId,
        eventId,
        rating,
        comment,
      },
      include: {
        user: {
          select: { name: true },
        },
        event: {
          select: { title: true },
        },
      },
    });

    // Step 8 — Track activity
    await prisma.activity.create({
      data: {
        userId,
        eventId,
        action: 'reviewed',
      },
    });

    res.status(201).json({
      message: 'Review added successfully',
      review,
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── GET EVENT REVIEWS ───────────────────────────────────
export const getEventReviews = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Step 1 — Check event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    // Step 2 — Get all reviews for event
    const reviews = await prisma.review.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Step 3 — Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.status(200).json({
      message: 'Reviews fetched successfully',
      eventTitle: event.title,
      totalReviews: reviews.length,
      averageRating: Math.round(avgRating * 10) / 10,
      reviews,
    });

  } catch (error) {
    console.error('Get event reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── GET MY REVIEWS ──────────────────────────────────────
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Please login to view your reviews' });
      return;
    }

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            title: true,
            category: true,
            venue: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      message: 'Reviews fetched successfully',
      count: reviews.length,
      reviews,
    });

  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── DELETE REVIEW ───────────────────────────────────────
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Please login to delete a review' });
      return;
    }

    // Step 1 — Find review
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Step 2 — Check review belongs to this user
    if (review.userId !== userId) {
      res.status(403).json({ 
        message: 'Not authorized to delete this review' 
      });
      return;
    }

    // Step 3 — Delete review
    await prisma.review.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Review deleted successfully',
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};