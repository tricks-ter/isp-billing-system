// frontend/src/store/customerAuthStore.js
import { create } from 'zustand';

const useCustomerAuthStore = create((set) => ({
  customer: JSON.parse(localStorage.getItem('isp_customer_user')) || null,
  token: localStorage.getItem('isp_customer_token') || null,
  isAuthenticated: !!localStorage.getItem('isp_customer_token'),

  login: (customerData, token) => {
    localStorage.setItem('isp_customer_token', token);
    localStorage.setItem('isp_customer_user', JSON.stringify(customerData));
    set({ customer: customerData, token, isAuthenticated: true });
  },

  setCustomer: (customerData) => {
    localStorage.setItem('isp_customer_user', JSON.stringify(customerData));
    set({ customer: customerData });
  },

  logout: () => {
    localStorage.removeItem('isp_customer_token');
    localStorage.removeItem('isp_customer_user');
    set({ customer: null, token: null, isAuthenticated: false });
  },
}));

export default useCustomerAuthStore;

