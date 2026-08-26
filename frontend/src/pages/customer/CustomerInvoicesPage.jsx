// frontend/src/pages/customer/CustomerInvoicesPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../../services/customerPortalApi';
import BkashSandboxGuide from '../../components/BkashSandboxGuide';
import { formatMonthName, formatDisplayDate } from '../../utils/dateFormatter';
import {
  CreditCard, CheckCircle2, AlertCircle, Smartphone, Printer,
  FileText, Download, Loader2, ArrowRight, ShieldCheck, Plus, Calendar, X,
  ToggleLeft, ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerInvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayingId, setIsPayingId] = useState(null);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);
  const [dateFormatMode, setDateFormatMode] = useState('month'); // 'month' or 'exact'

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ['customerInvoices'],
    queryFn: () => customerPortalApi.getInvoices().then(res => res.data.data),
  });

  const handlePay = async (invoiceId) => {
    setIsPayingId(invoiceId);
    try {
      const res = await customerPortalApi.payBkash(invoiceId);
      if (res.data?.data?.bkashURL) {
        window.location.href = res.data.data.bkashURL;
      } else {
        toast.error('Failed to obtain bKash checkout URL');
        setIsPayingId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed');
      setIsPayingId(null);
    }
  };

  const handleAdvancePay = async () => {
    setIsPayingAdvance(true);
    try {
      const res = await customerPortalApi.payBkash({
        isAdvance: true,
        monthsCount: advanceMonths,
        customAmount: customAdvanceAmount ? parseFloat(customAdvanceAmount) : undefined,
      });
      if (res.data?.data?.bkashURL) {
        window.location.href = res.data.data.bkashURL;
      } else {
        toast.error('Failed to initiate advance payment');
        setIsPayingAdvance(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Advance payment initiation failed');
      setIsPayingAdvance(false);
    }
  };

  const handlePrint = (inv) => {
    setSelectedInvoice(inv);
    setTimeout(() => window.print(), 200);
  };

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const currentOrPastInvoices = invoices?.filter(i => i.month <= currentMonth) || [];
  const futureAdvanceInvoices = invoices?.filter(i => i.month > currentMonth) || [];

  const totalBilled = invoices?.reduce((sum, i) => sum + i.total, 0) || 0;
  const totalPaid = invoices?.reduce((sum, i) => sum + i.paidAmount, 0) || 0;
  const currentMonthDue = currentOrPastInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Invoices &amp; Bills
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your monthly billing statements, pay dues, or recharge with bKash
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Toggle Button: Month View vs Exact Date */}
          <button
            onClick={() => setDateFormatMode(dateFormatMode === 'month' ? 'exact' : 'month')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center space-x-2 transition cursor-pointer"
            title="Switch date format display"
          >
            {dateFormatMode === 'month' ? (
              <>
                <ToggleLeft className="w-4 h-4 text-blue-400" />
                <span>Month View (e.g. August 2026)</span>
              </>
            ) : (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-400" />
                <span>Exact Date (DD/MM/YYYY)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embedded Sandbox Test Instructions */}
      <BkashSandboxGuide />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Invoices</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {invoices?.length || 0}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-emerald-400 uppercase font-bold tracking-wider">Total Amount Paid</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            ৳{totalPaid.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs text-pink-400 uppercase font-bold tracking-wider">Current Month Due</span>
          <div className="text-2xl sm:text-3xl font-black text-pink-400 mt-1">
            ৳{currentMonthDue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Monthly Billing Statements</h3>
          <span className="text-xs text-slate-400">{invoices?.length || 0} Records</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <span>Loading billing statements...</span>
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic">No invoices found for your account.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <th className="pb-3 pr-4">Billing Month</th>
                  <th className="pb-3 pr-4">Total Bill</th>
                  <th className="pb-3 pr-4">Paid</th>
                  <th className="pb-3 pr-4">Due Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isDue = !isPaid;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-bold text-white">
                          {dateFormatMode === 'month' ? formatMonthName(inv.month) : inv.month}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">#{inv.id}</span>
                      </td>
                      <td className="py-4 pr-4 text-slate-200 font-medium">৳{inv.total}</td>
                      <td className="py-4 pr-4 text-emerald-400 font-semibold">৳{inv.paidAmount}</td>
                      <td className="py-4 pr-4 text-slate-300">
                        {formatDisplayDate(inv.dueDate, dateFormatMode, true)}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handlePrint(inv)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                            title="Print Invoice Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {isDue ? (
                            <button
                              onClick={() => handlePay(inv.id)}
                              disabled={isPayingId === inv.id}
                              className="px-3.5 py-1.5 bg-[#E2136E] hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                            >
                              {isPayingId === inv.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Smartphone className="w-3.5 h-3.5" />
                              )}
                              <span>Pay ৳{inv.dueAmount || inv.total}</span>
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center space-x-1 text-xs px-2 py-1 bg-emerald-500/10 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 print:p-0 print:static print:bg-transparent">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b pb-4 print:hidden">
              <h4 className="font-bold text-base">Invoice Receipt #{selectedInvoice.id}</h4>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-black">BROADBAND INTERNET BILL</h2>
                <p className="text-xs text-slate-500">Official Payment Statement • {formatMonthName(selectedInvoice.month)}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Billing Period:</span>
                  <span className="font-bold">{formatMonthName(selectedInvoice.month)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-bold">৳{selectedInvoice.total}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">৳{selectedInvoice.paidAmount}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Due Date:</span>
                  <span className="font-medium">{formatDisplayDate(selectedInvoice.dueDate, 'month', true)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-black text-blue-600">{selectedInvoice.status}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Copy</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
