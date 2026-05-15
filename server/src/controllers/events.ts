import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { CreateEventInput } from '../types/index';

// ─── GET ALL EVENTS ──────────────────────────────────────
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string | undefined;
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;

    const events = await prisma.event.findMany({
      where: {
        ...(city && { city }),
        ...(category && { category }),
        ...(status ? { status } : { status: 'active' }),
      },
      orderBy: {
        dateTime: 'asc',
      },
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
          },
        },
      },
    });

    res.status(200).json({
      message: 'Events fetched successfully',
      count: events.length,
      events,
    });

  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── GET SINGLE EVENT ────────────────────────────────────
export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            seats: true,
            bookings: true,
            reviews: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!event) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({
      message: 'Event fetched successfully',
      event,
    });

  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── CREATE EVENT ────────────────────────────────────────
export const createEvent = async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      venue,
      city,
      dateTime,
      posterUrl,
      description,
      language,
      durationMins,
    }: CreateEventInput = req.body;

    // Step 1 — Check required fields
    if (!title || !category || !venue || !city || !dateTime || !description || !durationMins) {
      res.status(400).json({ message: 'All required fields must be provided' });
      return;
    }

    // Step 2 — Create event
    const event = await prisma.event.create({
      data: {
        title,
        category,
        venue,
        city,
        dateTime: new Date(dateTime),
        posterUrl,
        description,
        language,
        durationMins,
      },
    });

    res.status(201).json({
      message: 'Event created successfully',
      event,
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── GET SEATS FOR EVENT ─────────────────────────────────
export const getEventSeats = async (req: Request, res: Response) => {
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

    // Step 2 — Get all seats
    const seats = await prisma.seat.findMany({
      where: { eventId: id },
      orderBy: [
        { row: 'asc' },
        { column: 'asc' },
      ],
    });

    // Step 3 — Count available and booked
    const available = seats.filter(s => !s.isBooked).length;
    const booked = seats.filter(s => s.isBooked).length;

    res.status(200).json({
      message: 'Seats fetched successfully',
      eventId: id,
      totalSeats: seats.length,
      availableSeats: available,
      bookedSeats: booked,
      seats,
    });

  } catch (error) {
    console.error('Get event seats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};