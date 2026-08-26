// frontend/src/services/bkashApi.js
import axios from 'axios';
import api, { getApiBaseUrl } from './api';

// Create a public axios instance for unauthenticated public quick-pay
const publicApi = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const bkashApi = {
  // Public Endpoint: Fetch invoice by token for customer quick-pay
  getPublicInvoice: (token) => publicApi.get(`/bkash/public-invoice/${token}`),

  // Public/Private Endpoint: Initiate bKash payment
  createPayment: (data) => publicApi.post('/bkash/create', data),

  // Private Endpoint: Generate/Fetch quick-pay public link for an invoice
  generateQuickPayLink: (invoiceId) => api.post(`/bkash/generate-link/${invoiceId}`),

  // Private Endpoint: Query bKash transaction status
  queryPayment: (paymentId) => api.get(`/bkash/query/${paymentId}`),
};

export default bkashApi;
