import api from './api';

export const invoiceApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/invoices${queryParams ? `?${queryParams}` : ''}`);
  },

  getById: (id) => api.get(`/invoices/${id}`),

  generate: (data) => api.post('/invoices/generate', data),

  getMonthlySummary: (month) => api.get(`/invoices/summary?month=${month}`),
};