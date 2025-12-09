import { apiClient } from './client';
import { ServiceInstance } from '../types';

export async function fetchServices(token: string): Promise<ServiceInstance[]> {
  const { data } = await apiClient.get('/console/services', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.data;
}
