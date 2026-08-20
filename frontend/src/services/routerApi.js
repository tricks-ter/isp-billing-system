// frontend/src/services/routerApi.js
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

  // NEW: MikroTik management endpoints
  getRouterInfo: (id) => api.get(`/routers/${id}/info`),
  getPppoeSecrets: (id) => api.get(`/routers/${id}/pppoe-secrets`),
  createPppoeSecret: (id, data) => api.post(`/routers/${id}/pppoe-secrets`, data),
  updatePppoeSecret: (id, username, data) => api.put(`/routers/${id}/pppoe-secrets/${username}`, data),
  deletePppoeSecret: (id, username) => api.delete(`/routers/${id}/pppoe-secrets/${username}`),
  getActiveSessions: (id) => api.get(`/routers/${id}/active-sessions`),
  getProfiles: (id) => api.get(`/routers/${id}/profiles`),
  getSimpleQueues: (id) => api.get(`/routers/${id}/queues`),
};