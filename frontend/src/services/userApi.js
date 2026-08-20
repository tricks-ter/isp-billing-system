import api from './api';

export const userApi = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  changePassword: (data) => api.post('/users/change-password', data),
  updateProfile: (data) => api.put('/users/profile/me', data),
};