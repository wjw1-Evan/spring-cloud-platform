import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '',
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    return Promise.reject(error);
  },
);
