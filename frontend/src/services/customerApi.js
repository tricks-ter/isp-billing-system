import api from './api';

export const customerApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/customers${queryParams ? `?${queryParams}` : ''}`);
  },

  getStats: () => api.get('/customers/stats'),

  getById: (id) => api.get(`/customers/${id}`),

  create: (data) => api.post('/customers', data),

  update: (id, data) => api.put(`/customers/${id}`, data),

  delete: (id) => api.delete(`/customers/${id}`),

  suspend: (id) => api.post(`/customers/${id}/suspend`),

  restore: (id) => api.post(`/customers/${id}/restore`),

  getCollectionSummary: () => api.get('/customers/collection-summary'),

  updateCollectionNote: (id, data) => api.put(`/customers/${id}/collection-note`, data),
};