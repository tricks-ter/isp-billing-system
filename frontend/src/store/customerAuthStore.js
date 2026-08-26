// frontend/src/store/customerAuthStore.js
import { create } from 'zustand';

const getStoredCustomer = () => {
  try {
    const raw = localStorage.getItem('isp_customer_user');
    return raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Failed to parse stored isp_customer_user:', e);
    localStorage.removeItem('isp_customer_user');
    return null;
  }
};

const getStoredToken = () => {
  try {
    const token = localStorage.getItem('isp_customer_token');
    return token && token !== 'undefined' && token !== 'null' ? token : null;
  } catch (e) {
    return null;
  }
};

const initialCustomer = getStoredCustomer();
const initialToken = getStoredToken();

const useCustomerAuthStore = create((set) => ({
  customer: initialCustomer,
  token: initialToken,
  isAuthenticated: !!initialToken,

  login: (customerData, token) => {
    try {
      localStorage.setItem('isp_customer_token', token);
      localStorage.setItem('isp_customer_user', JSON.stringify(customerData));
    } catch (_) {}
    set({ customer: customerData, token, isAuthenticated: true });
  },

  setCustomer: (customerData) => {
    try {
      localStorage.setItem('isp_customer_user', JSON.stringify(customerData));
    } catch (_) {}
    set({ customer: customerData });
  },

  logout: () => {
    try {
      localStorage.removeItem('isp_customer_token');
      localStorage.removeItem('isp_customer_user');
    } catch (_) {}
    set({ customer: null, token: null, isAuthenticated: false });
  },
}));

export default useCustomerAuthStore;
