// frontend/src/pages/PaymentsPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../services/paymentApi';
import {
  Receipt, Wallet, Smartphone, Building2, Download,
  Copy, Check, Phone, ExternalLink
} from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { exportCSV } from '../utils/export';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [methodFilter, setMethodFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [copiedTrxId, setCopiedTrxId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { methodFilter, fromDate, toDate, page }],
    queryFn: () => paymentApi.getAll({
      method: methodFilter,
      fromDate,
      toDate,
      page,
      limit: 20,
    }).then(res => res.data.data),
    refetchInterval: 10000,
  });

  const getMethodIcon = (method) => {
    const icons = {
      CASH: { icon: Wallet, color: 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400' },
      BKASH: { icon: Smartphone, color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-400' },
      NAGAD: { icon: Smartphone, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400' },
      BANK: { icon: Building2, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' },
    };
    return icons[method] || icons.CASH;
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTrxId(text);
    toast.success(`Copied TrxID: ${text}`);
    setTimeout(() => setCopiedTrxId(null), 2000);
  };

  const handleExportCSV = () => {
    if (!data?.payments || data.payments.length === 0) {
      toast.error('No payments to export');
      return;
    }
    const columns = [
      { key: 'trxId', label: 'Transaction ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'amount', label: 'Amount (৳)' },
      { key: 'method', label: 'Method' },
      { key: 'receivedBy', label: 'Received By' },
      { key: 'date', label: 'Date' },
      { key: 'notes', label: 'Notes' },
    ];
    const dataToExport = data.payments.map(p => ({
      trxId: p.trxId || 'N/A',
      customer: p.invoice?.customer?.name || 'N/A',
      phone: p.invoice?.customer?.phone || 'N/A',
      amount: p.amount,
      method: p.method,
      receivedBy: p.receiver?.fullName || 'Online Gateway',
      date: new Date(p.date).toLocaleString('en-GB'),
      notes: p.notes || '',
    }));
    exportCSV(dataToExport, columns, `payments_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payments &amp; Collections</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Payment history, bKash TrxIDs, and collection records</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 lg:p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Method</label>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="BKASH">bKash PGW</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK">Bank</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Date &amp; Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Transaction ID / Ref</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Method</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Received By</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading payments...</td></tr>
              ) : data?.payments?.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No payments found</td></tr>
              ) : (
                data?.payments?.map((payment) => {
                  const methodInfo = getMethodIcon(payment.method);
                  const isCopied = copiedTrxId === payment.trxId;

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {new Date(payment.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.trxId ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 select-all">
                              {payment.trxId}
                            </span>
                            <button
                              onClick={() => handleCopy(payment.trxId)}
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="Copy TrxID"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{payment.invoice?.customer?.name}</div>
                        <a
                          href={`tel:${payment.invoice?.customer?.phone}`}
                          className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono"
                          title="Click to dial"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{payment.invoice?.customer?.phone}</span>
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        ৳{payment.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold ${methodInfo.color}`}>
                          <methodInfo.icon className="w-3.5 h-3.5" />
                          <span>{payment.method}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {payment.receiver?.fullName || 'Online Gateway'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-700">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading payments...</div>
          ) : data?.payments?.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">No payments found</p>
            </div>
          ) : (
            data?.payments?.map((payment) => {
              const methodInfo = getMethodIcon(payment.method);
              const isCopied = copiedTrxId === payment.trxId;

              return (
                <div key={payment.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{payment.invoice?.customer?.name}</h3>
                      <a
                        href={`tel:${payment.invoice?.customer?.phone}`}
                        className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{payment.invoice?.customer?.phone}</span>
                      </a>
                    </div>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">৳{payment.amount}</p>
                  </div>

                  {payment.trxId && (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-xs font-mono">
                      <span className="text-slate-500 uppercase text-[10px] font-bold">TrxID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-primary select-all">{payment.trxId}</span>
                        <button
                          onClick={() => handleCopy(payment.trxId)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${methodInfo.color}`}>
                      <methodInfo.icon className="w-3 h-3" />
                      <span>{payment.method}</span>
                    </span>
                    <span>{new Date(payment.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="text-xs sm:text-sm text-slate-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}