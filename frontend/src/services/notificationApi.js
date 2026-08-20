// frontend/src/services/notificationApi.js
import api from './api';

export const notificationApi = {
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/notifications${queryParams ? `?${queryParams}` : ''}`);
  },
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  sendReminders: () => api.post('/notifications/send-reminders'), // NEW
};