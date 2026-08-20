import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../services/financeApi';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

export default function FinancePage() {
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '' });
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions', { ...filters, page }],
    queryFn: () => financeApi.getTransactions({ ...filters, page, limit: 20 }).then(res => res.data.data),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['financeSummary', currentMonth],
    queryFn: () => financeApi.getMonthlySummary(currentMonth).then(res => res.data.data),
  });

  const addIncomeMutation = useMutation({
    mutationFn: (data) => financeApi.addIncome(data),
    onSuccess: () => { toast.success('Income recorded'); queryClient.invalidateQueries(['transactions']); queryClient.invalidateQueries(['financeSummary']); setIsIncomeOpen(false); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data) => financeApi.addExpense(data),
    onSuccess: () => { toast.success('Expense recorded'); queryClient.invalidateQueries(['transactions']); queryClient.invalidateQueries(['financeSummary']); setIsExpenseOpen(false); },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
          <p className="text-sm text-slate-500 mt-1">Track income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="success" onClick={() => setIsIncomeOpen(true)}><ArrowUpRight className="w-4 h-4" /><span>Add Income</span></Button>
          <Button variant="danger" onClick={() => setIsExpenseOpen(true)}><ArrowDownRight className="w-4 h-4" /><span>Add Expense</span></Button>
        </div>
      </div>

      {summaryData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Customer Payments</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900">৳{summaryData.customerPayments?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Other Income</p>
            <p className="text-xl lg:text-2xl font-bold text-green-600">৳{summaryData.otherIncome?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total Expenses</p>
            <p className="text-xl lg:text-2xl font-bold text-red-600">৳{summaryData.totalExpense?.toLocaleString() || 0}</p>
          </div>
          <div className={`rounded-xl border p-4 ${summaryData.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs mb-1 ${summaryData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Net Profit</p>
            <p className={`text-xl lg:text-2xl font-bold ${summaryData.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>৳{summaryData.netProfit?.toLocaleString() || 0}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">From Date</label>
            <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">To Date</label>
            <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {transactionsData?.transactions?.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No transactions found</div>
          ) : (
            transactionsData?.transactions?.map((t) => (
              <div key={`${t.type}-${t.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {t.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{t.category}</p>
                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('en-GB')} • {t.recorder?.fullName}</p>
                    {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                  </div>
                </div>
                <p className={`text-lg font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'INCOME' ? '+' : '-'}৳{t.amount.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isIncomeOpen} onClose={() => setIsIncomeOpen(false)} title="Add Income">
        <FinanceForm type="income" onSubmit={(data) => addIncomeMutation.mutate(data)} isLoading={addIncomeMutation.isPending} onCancel={() => setIsIncomeOpen(false)} />
      </Modal>
      <Modal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} title="Add Expense">
        <FinanceForm type="expense" onSubmit={(data) => addExpenseMutation.mutate(data)} isLoading={addExpenseMutation.isPending} onCancel={() => setIsExpenseOpen(false)} />
      </Modal>
    </div>
  );
}

function FinanceForm({ type, onSubmit, isLoading, onCancel }) {
  const [formData, setFormData] = useState({ category: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const categories = type === 'income' ? ['Service Fee', 'Installation', 'Equipment Sale', 'Other'] : ['Electricity', 'Internet', 'Rent', 'Salary', 'Maintenance', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, amount: parseFloat(formData.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required>
          <option value="">Select category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Amount (৳)</label>
        <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" isLoading={isLoading}>{type === 'income' ? 'Record Income' : 'Record Expense'}</Button>
      </div>
    </form>
  );
}