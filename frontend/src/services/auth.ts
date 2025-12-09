import { apiClient } from './client';
import { LoginResponse, UserInfo } from '../types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data;
}

export async function register(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/register', { email, password });
  return data.data;
}

export async function refresh(refreshToken: string): Promise<LoginResponse> {
  const { data } = await apiClient.post('/auth/refresh', { refreshToken });
  return data.data;
}

export async function getCurrentUser(token: string): Promise<UserInfo> {
  const { data } = await apiClient.get('/users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data;
}
