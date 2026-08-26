// frontend/src/services/oltApi.js
import api from './api';

export const oltApi = {
  getAll: (params) => api.get('/olts', { params }),
  getById: (id) => api.get(`/olts/${id}`),
  create: (data) => api.post('/olts', data),
  update: (id, data) => api.put(`/olts/${id}`, data),
  delete: (id) => api.delete(`/olts/${id}`),
  testConnection: (id) => api.post(`/olts/${id}/test`),
  sync: (id) => api.post(`/olts/${id}/sync`),

  getPonPorts: (id) => api.get(`/olts/${id}/pon-ports`),
  getRegisteredOnus: (id, params) => api.get(`/olts/${id}/onus`, { params }),
  getUnregisteredOnus: (id) => api.get(`/olts/${id}/unregistered`),
  getOpticalDiagnostics: (id, onuId) => api.get(`/olts/${id}/onus/${onuId}/diagnostics`),

  authorizeOnu: (id, data) => api.post(`/olts/${id}/authorize-onu`, data),
  unauthorizeOnu: (id, onuId) => api.delete(`/olts/${id}/onus/${onuId}`),
  rebootOnu: (id, onuId) => api.post(`/olts/${id}/onus/${onuId}/reboot`),
  toggleOnuPort: (id, onuId, disable) => api.post(`/olts/${id}/onus/${onuId}/toggle-port`, { disable }),

  executeRawCli: (id, command) => api.post(`/olts/${id}/cli`, { command }),
  getOpticalSummary: () => api.get('/olts/optical-summary'),
};

