import api from './api';

export const paymentApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/payments${queryParams ? `?${queryParams}` : ''}`);
  },

  record: (data) => api.post('/payments', data),

  getDailyCollection: (date) => api.get(`/payments/daily?date=${date}`),
};