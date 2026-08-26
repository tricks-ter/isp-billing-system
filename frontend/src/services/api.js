// frontend/src/services/api.js
import axios from 'axios';

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://isp-billing-backend-05ja.onrender.com/api';
  }
  return 'http://localhost:3001/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('isp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isPublicPath = path.includes('/login') || path.startsWith('/pay/') || path.startsWith('/payment/');
      if (!isPublicPath) {
        localStorage.removeItem('isp_token');
        localStorage.removeItem('isp_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;