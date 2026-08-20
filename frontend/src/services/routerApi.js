import api from './api';

export const routerApi = {
  getAll: () => api.get('/routers'),
  getById: (id) => api.get(`/routers/${id}`),
  create: (data) => api.post('/routers', data),
  update: (id, data) => api.put(`/routers/${id}`, data),
  delete: (id) => api.delete(`/routers/${id}`),
  testConnection: (id) => api.post(`/routers/${id}/test`),
  getLiveStatus: () => api.get('/routers/live-status'),
  bulkSuspend: (customerIds) => api.post('/routers/bulk/suspend', { customerIds }),
  bulkRestore: (customerIds) => api.post('/routers/bulk/restore', { customerIds }),
};