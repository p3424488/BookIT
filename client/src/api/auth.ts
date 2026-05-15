import api from './axios';
import type { AuthResponse } from '../types/index';

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  city?: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  return response.data;
};