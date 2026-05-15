import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ─── SEARCH EVENTS ───────────────────────────────────────
export const searchEvents = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const city = req.query.city as string | undefined;
    const category = req.query.category as string | undefined;
    const minPrice = req.query.minPrice
      ? parseFloat(req.query.minPrice as string)
      : undefined;
    const maxPrice = req.query.maxPrice
      ? parseFloat(req.query.maxPrice as string)
      : undefined;

    // Step 1 — Build search filters
    const where: any = {
      status: 'active',
      ...(city && { city }),
      ...(category && { category }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { venue: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            seats: {
              some: {
                price: {
                  ...(minPrice !== undefined && { gte: minPrice }),
                  ...(maxPrice !== undefined && { lte: maxPrice }),
                },
              },
            },
          }
        : {}),
    };

    // Step 2 — Run search query
    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        venue: true,
        city: true,
        dateTime: true,
        posterUrl: true,
        description: true,
        language: true,
        durationMins: true,
        status: true,
        _count: {
          select: {
            seats: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { dateTime: 'asc' },
    });

    // Step 3 — If no results found
    if (events.length === 0) {
      res.status(200).json({
        message: 'No events found matching your search',
        count: 0,
        events: [],
      });
      return;
    }

    res.status(200).json({
      message: 'Search results fetched successfully',
      count: events.length,
      query: { q, city, category, minPrice, maxPrice },
      events,
    });

  } catch (error) {
    console.error('Search events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── GET CATEGORIES ──────────────────────────────────────
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.event.findMany({
      where: { status: 'active' },
      select: { category: true },
      distinct: ['category'],
    });

    const cities = await prisma.event.findMany({
      where: { status: 'active' },
      select: { city: true },
      distinct: ['city'],
    });

    res.status(200).json({
      message: 'Filters fetched successfully',
      categories: categories.map(c => c.category),
      cities: cities.map(c => c.city),
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};