import api from './api';

export const auditApi = {
  getLogs: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/audit${queryParams ? `?${queryParams}` : ''}`);
  },
  getStats: () => api.get('/audit/stats'),
};