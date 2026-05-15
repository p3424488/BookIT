import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ─── GET RECOMMENDATIONS FOR USER ────────────────────────
export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'Please login to get recommendations' });
      return;
    }

    // Step 1 — Call Python ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/recommendations/${userId}`);
    const mlData = await mlResponse.json() as { recommendations: string[] };

    if (!mlData.recommendations || mlData.recommendations.length === 0) {
      // Fallback — return latest events
      const events = await prisma.event.findMany({
        where: { status: 'active' },
        take: 6,
        orderBy: { dateTime: 'asc' },
      });
      res.status(200).json({
        message: 'Recommendations fetched successfully',
        recommendations: events,
        source: 'fallback',
      });
      return;
    }

    // Step 2 — Get full event details from database
    const events = await prisma.event.findMany({
      where: {
        id: { in: mlData.recommendations },
        status: 'active',
      },
    });

    // Step 3 — Sort by ML recommendation order
    const sortedEvents = mlData.recommendations
      .map(id => events.find(e => e.id === id))
      .filter(Boolean);

    res.status(200).json({
      message: 'Recommendations fetched successfully',
      recommendations: sortedEvents,
      source: 'ml',
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    // Fallback if ML service is down
    try {
      const events = await prisma.event.findMany({
        where: { status: 'active' },
        take: 6,
        orderBy: { dateTime: 'asc' },
      });
      res.status(200).json({
        message: 'Recommendations fetched successfully',
        recommendations: events,
        source: 'fallback',
      });
    } catch {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// ─── GET SIMILAR EVENTS ───────────────────────────────────
export const getSimilarEvents = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id as string;

    // Call Python ML service
    const mlResponse = await fetch(`${ML_SERVICE_URL}/similar/${eventId}`);
    const mlData = await mlResponse.json() as { similar: string[] };

    if (!mlData.similar || mlData.similar.length === 0) {
      res.status(200).json({ similar: [] });
      return;
    }

    // Get full event details
    const events = await prisma.event.findMany({
      where: {
        id: { in: mlData.similar },
        status: 'active',
      },
    });

    res.status(200).json({
      message: 'Similar events fetched successfully',
      similar: events,
    });

  } catch (error) {
    console.error('Similar events error:', error);
    res.status(200).json({ similar: [] });
  }
};