export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  city?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface CreateEventInput {
  title: string;
  category: string;
  venue: string;
  city: string;
  dateTime: string;
  posterUrl?: string;
  description: string;
  language?: string;
  durationMins: number;
}

export interface EventFilters {
  city?: string | string[];
  category?: string | string[];
  status?: string | string[];
}

export interface BookingLockRequest {
  eventId: string;
  seatIds: string[];
}

export interface BookingConfirmRequest {
  lockId: string;
  paymentDetails: {
    method: string;
    transactionId: string;
  };
}

export type BookingStatus = 'locked' | 'confirmed' | 'cancelled' | 'expired';

export interface Booking {
  id: string;
  userId: string;
  eventId: string;
  seatIds: string[];
  status: BookingStatus;
  lockExpiresAt?: Date;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type LockSeatsInput = BookingLockRequest;

export interface ConfirmBookingInput {
  eventId: string;
  seatIds: string[];
  paymentId?: string;
}

export interface CreateReviewInput {
  eventId: string;
  rating: number;
  comment?: string;
}

export interface SearchInput {
  q?: string;
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}