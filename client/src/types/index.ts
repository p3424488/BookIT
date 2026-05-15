export interface User {
  id: string;
  name: string;
  email: string;
  city?: string;
}

export interface Event {
  id: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  dateTime: string;
  posterUrl?: string;
  description: string;
  language?: string;
  durationMins: number;
  status: string;
  _count?: {
    seats: number;
    bookings: number;
    reviews: number;
  };
}

export interface Seat {
  id: string;
  eventId: string;
  row: string;
  column: number;
  category: string;
  price: number;
  isBooked: boolean;
}

export interface Booking {
  id: string;
  eventId: string;
  seatIds: string[];
  total: number;
  status: string;
  createdAt: string;
  event: {
    title: string;
    venue: string;
    city: string;
    dateTime: string;
    posterUrl?: string;
  };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { name: string };
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}