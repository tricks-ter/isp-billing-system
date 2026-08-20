import api from './api';

export const activityApi = {
  getRecent: (limit = 5) => {
    return api.get('/audit', { params: { limit, page: 1 } });
  },
  
  getStats: () => {
    return api.get('/audit/stats');
  }
};