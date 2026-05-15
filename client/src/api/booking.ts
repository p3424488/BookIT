import api from './axios';
import type { Booking } from '../types/index';

export const lockSeats = async (data: {
  eventId: string;
  seatIds: string[];
}): Promise<{
  message: string;
  total: number;
  lockedSeats: {
    id: string;
    row: string;
    column: number;
    category: string;
    price: number;
  }[];
}> => {
  const response = await api.post('/bookings/lock', data);
  return response.data;
};

export const confirmBooking = async (data: {
  eventId: string;
  seatIds: string[];
  paymentId?: string;
}): Promise<{ message: string; booking: Booking }> => {
  const response = await api.post('/bookings/confirm', data);
  return response.data;
};

export const getMyBookings = async (): Promise<{
  bookings: Booking[];
  count: number;
}> => {
  const response = await api.get('/bookings/my');
  return response.data;
};

export const cancelBooking = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.put(`/bookings/${id}/cancel`);
  return response.data;
};

export const createPaymentOrder = async (data: {
  amount: number;
  eventId: string;
  seatIds: string[];
}): Promise<{
  order: { id: string; amount: number; currency: string };
  key: string;
}> => {
  const response = await api.post('/payments/create-order', data);
  return response.data;
};

export const verifyPayment = async (data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  eventId: string;
  seatIds: string[];
}): Promise<{ message: string; booking: Booking }> => {
  const response = await api.post('/payments/verify', data);
  return response.data;
};