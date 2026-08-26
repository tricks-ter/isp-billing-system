// frontend/src/services/ticketApi.js
import api from './api';

export const ticketApi = {
  getAll: (params) => api.get('/tickets', { params }),
  getStats: () => api.get('/tickets/stats'),
  getById: (id) => api.get(`/tickets/${id}`),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
};
