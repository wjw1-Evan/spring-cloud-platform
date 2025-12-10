import axios from 'axios';

const baseURL = (import.meta as any)?.env?.VITE_API_BASE_URL ?? '';

export const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    return Promise.reject(error);
  },
);
