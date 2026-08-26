// frontend/src/services/customerPortalApi.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const customerApi = axios.create({
  baseURL: `${API_URL}/customer-portal`,
  headers: {
    'Content-Type': 'application/json',
  },
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('isp_customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('isp_customer_token');
      localStorage.removeItem('isp_customer_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?tab=customer';
      }
    }
    return Promise.reject(error);
  }
);

export const customerPortalApi = {
  login: (data) => customerApi.post('/auth/login', data),
  getDashboard: () => customerApi.get('/dashboard'),
  getInvoices: () => customerApi.get('/invoices'),
  getPayments: () => customerApi.get('/payments'),
  getTickets: () => customerApi.get('/tickets'),
  createTicket: (data) => customerApi.post('/tickets', data),
  getPackages: () => customerApi.get('/packages'),
  payBkash: (payload) => {
    const data = typeof payload === 'object' ? payload : { invoiceId: payload };
    return customerApi.post('/pay/bkash', data);
  },
};

