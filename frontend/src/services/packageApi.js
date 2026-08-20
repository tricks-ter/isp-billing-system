import api from './api';

export const packageApi = {
  getAll: () => api.get('/packages'),

  getById: (id) => api.get(`/packages/${id}`),

  create: (data) => api.post('/packages', data),

  update: (id, data) => api.put(`/packages/${id}`, data),

  delete: (id) => api.delete(`/packages/${id}`),
};