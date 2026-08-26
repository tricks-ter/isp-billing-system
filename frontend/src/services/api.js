import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
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