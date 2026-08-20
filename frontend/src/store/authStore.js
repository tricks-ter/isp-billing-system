import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('isp_user')) || null,
  token: localStorage.getItem('isp_token') || null,
  isAuthenticated: !!localStorage.getItem('isp_token'),

  login: (userData, token) => {
    localStorage.setItem('isp_token', token);
    localStorage.setItem('isp_user', JSON.stringify(userData));
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('isp_token');
    localStorage.removeItem('isp_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;