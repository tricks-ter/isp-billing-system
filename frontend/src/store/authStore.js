// frontend/src/store/authStore.js
import { create } from 'zustand';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('isp_user');
    return raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to parse stored isp_user:', e);
    localStorage.removeItem('isp_user');
    return null;
  }
};

const getStoredToken = () => {
  try {
    const token = localStorage.getItem('isp_token');
    return token && token !== 'undefined' && token !== 'null' ? token : null;
  } catch (e) {
    return null;
  }
};

const initialUser = getStoredUser();
const initialToken = getStoredToken();

const useAuthStore = create((set) => ({
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,

  login: (userData, token) => {
    try {
      localStorage.setItem('isp_token', token);
      localStorage.setItem('isp_user', JSON.stringify(userData));
    } catch (_) {}
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem('isp_token');
      localStorage.removeItem('isp_user');
    } catch (_) {}
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;