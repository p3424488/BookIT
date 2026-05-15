import api from './axios';
import type { Event, Seat } from '../types/index';

export const getEvents = async (filters?: {
  city?: string;
  category?: string;
}): Promise<{ events: Event[]; count: number }> => {
  const params = new URLSearchParams();
  if (filters?.city) params.append('city', filters.city);
  if (filters?.category) params.append('category', filters.category);
  const response = await api.get(`/events?${params.toString()}`);
  return response.data;
};

export const getEventById = async (
  id: string
): Promise<{ event: Event }> => {
  const response = await api.get(`/events/${id}`);
  return response.data;
};

export const getEventSeats = async (
  id: string
): Promise<{ seats: Seat[]; availableSeats: number; totalSeats: number }> => {
  const response = await api.get(`/events/${id}/seats`);
  return response.data;
};

export const searchEvents = async (params: {
  q?: string;
  city?: string;
  category?: string;
}): Promise<{ events: Event[]; count: number }> => {
  const query = new URLSearchParams();
  if (params.q) query.append('q', params.q);
  if (params.city) query.append('city', params.city);
  if (params.category) query.append('category', params.category);
  const response = await api.get(`/search?${query.toString()}`);
  return response.data;
};

export const getFilters = async (): Promise<{
  categories: string[];
  cities: string[];
}> => {
  const response = await api.get('/search/filters');
  return response.data;
};

export const getRecommendations = async (): Promise<{
  recommendations: Event[];
  source: string;
}> => {
  const response = await api.get('/recommendations');
  return response.data;
};

export const getSimilarEvents = async (
  eventId: string
): Promise<{ similar: Event[] }> => {
  const response = await api.get(`/recommendations/similar/${eventId}`);
  return response.data;
};