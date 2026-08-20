import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../services/paymentApi';
import { invoiceApi } from '../services/invoiceApi';
import { TrendingUp, TrendingDown, Wallet, Smartphone, Building2, Calendar } from 'lucide-react';
import Button from '../components/Button';

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // Daily collection
  const { data: dailyData } = useQuery({
    queryKey: ['dailyCollection', selectedDate],
    queryFn: () => paymentApi.getDailyCollection(selectedDate).then(res => res.data.data),
  });

  // Monthly summary
  const { data: monthlyData } = useQuery({
    queryKey: ['monthlySummary', selectedMonth],
    queryFn: () => invoiceApi.getMonthlySummary(selectedMonth).then(res => res.data.data),
  });

  const methodIcons = {
    CASH: { icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
    BKASH: { icon: Smartphone, color: 'text-pink-600', bg: 'bg-pink-100' },
    NAGAD: { icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-100' },
    BANK: { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Date Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Daily Report Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Monthly Report</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Daily Collection */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Daily Collection</span>
          </h2>
          <p className="text-sm text-slate-500">{new Date(selectedDate).toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
        </div>

        {dailyData ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-600 mb-1">Total Collected</p>
                <p className="text-xl lg:text-2xl font-bold text-green-700">৳{dailyData.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Transactions</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{dailyData.totalPayments}</p>
              </div>
              <div className="col-span-2 lg:col-span-1 bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Avg. Transaction</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">
                  ৳{dailyData.totalPayments > 0 ? Math.round(dailyData.totalAmount / dailyData.totalPayments) : 0}
                </p>
              </div>
            </div>

            {/* By Method */}
            {Object.keys(dailyData.byMethod).length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Collection by Method</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {Object.entries(dailyData.byMethod).map(([method, amount]) => {
                    const info = methodIcons[method] || methodIcons.CASH;
                    return (
                      <div key={method} className={`${info.bg} rounded-lg p-3`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <info.icon className={`w-4 h-4 ${info.color}`} />
                          <span className="text-xs font-medium text-slate-700">{method}</span>
                        </div>
                        <p className={`text-lg font-bold ${info.color}`}>৳{amount.toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-slate-500 py-8">No data for selected date</p>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Monthly Summary</span>
          </h2>
          <p className="text-sm text-slate-500">{selectedMonth}</p>
        </div>

        {monthlyData ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Total Invoices</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">{monthlyData.totalInvoices}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Total Billed</p>
                <p className="text-xl lg:text-2xl font-bold text-slate-900">৳{monthlyData.totalAmount.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-600 mb-1">Collected</p>
                <p className="text-xl lg:text-2xl font-bold text-green-700">৳{monthlyData.totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs text-red-600 mb-1">Outstanding</p>
                <p className="text-xl lg:text-2xl font-bold text-red-700">৳{monthlyData.totalDue.toLocaleString()}</p>
              </div>
            </div>

            {/* Collection Rate */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Collection Rate</span>
                <span className="text-sm font-bold text-slate-900">
                  {monthlyData.totalAmount > 0
                    ? Math.round((monthlyData.totalPaid / monthlyData.totalAmount) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${monthlyData.totalAmount > 0
                      ? (monthlyData.totalPaid / monthlyData.totalAmount) * 100
                      : 0}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Paid: {monthlyData.paidInvoices} invoices</span>
                <span>Unpaid: {monthlyData.unpaidInvoices} invoices</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-slate-500 py-8">No data for selected month</p>
        )}
      </div>
    </div>
  );
}