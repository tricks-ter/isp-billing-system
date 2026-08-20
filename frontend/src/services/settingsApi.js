// FILE: ./frontend/src/services/settingsApi.js
import api from './api';

export const settingsApi = {
  getMikrotikMockMode: () => api.get('/settings/mikrotik-mock-mode'),
  setMikrotikMockMode: (enabled) => api.put('/settings/mikrotik-mock-mode', { enabled }),
  getSmsMockMode: () => api.get('/settings/sms-mock-mode'),
  setSmsMockMode: (enabled) => api.put('/settings/sms-mock-mode', { enabled }),
  getAll: () => api.get('/settings'),
};