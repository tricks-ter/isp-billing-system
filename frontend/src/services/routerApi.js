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

  // Router info
  getRouterInfo: (id) => api.get(`/routers/${id}/info`),

  // PPPoE secrets (paginated)
  getPppoeSecretsPaginated: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/routers/${id}/pppoe-secrets/paginated${query ? `?${query}` : ''}`);
  },
  createPppoeSecret: (id, data) => api.post(`/routers/${id}/pppoe-secrets`, data),
  updatePppoeSecret: (id, username, data) => api.put(`/routers/${id}/pppoe-secrets/${username}`, data),
  deletePppoeSecret: (id, username) => api.delete(`/routers/${id}/pppoe-secrets/${username}`),
  togglePppoeSecret: (id, username, disable) => api.post(`/routers/${id}/pppoe-secrets/${username}/toggle`, { disable }),

  // Active sessions (paginated)
  getActiveSessionsPaginated: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/routers/${id}/active-sessions/paginated${query ? `?${query}` : ''}`);
  },
  removeActiveSession: (id, username) => api.delete(`/routers/${id}/active-sessions/${username}`),

  // Profiles (paginated)
  getProfilesPaginated: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/routers/${id}/profiles/paginated${query ? `?${query}` : ''}`);
  },

  // Queues (paginated)
  getSimpleQueuesPaginated: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/routers/${id}/queues/paginated${query ? `?${query}` : ''}`);
  },

  // CLI Terminal Command Execution
  executeCliCommand: (id, command) => api.post(`/routers/${id}/cli`, { command }),

  // Legacy (non-paginated) – kept for backward compatibility
  getPppoeSecrets: (id) => api.get(`/routers/${id}/pppoe-secrets`),
  getActiveSessions: (id) => api.get(`/routers/${id}/active-sessions`),
  getProfiles: (id) => api.get(`/routers/${id}/profiles`),
  getSimpleQueues: (id) => api.get(`/routers/${id}/queues`),
};