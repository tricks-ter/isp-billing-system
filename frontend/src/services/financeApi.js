import api from './api';

export const financeApi = {
  getTransactions: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/finance/transactions${queryParams ? `?${queryParams}` : ''}`);
  },
  getMonthlySummary: (month) => api.get(`/finance/monthly-summary?month=${month}`),
  addIncome: (data) => api.post('/finance/income', data),
  addExpense: (data) => api.post('/finance/expense', data),
};