// frontend/src/pages/customer/CustomerInvoicesPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../../services/customerPortalApi';
import {
  CreditCard, CheckCircle2, AlertCircle, Smartphone, Printer,
  FileText, Download, Loader2, ArrowRight, ShieldCheck, Plus, Calendar, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerInvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayingId, setIsPayingId] = useState(null);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [isPayingAdvance, setIsPayingAdvance] = useState(false);

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

  const totalBilled = invoices?.reduce((sum, i) => sum + i.total, 0) || 0;
  const totalPaid = invoices?.reduce((sum, i) => sum + i.paidAmount, 0) || 0;
  const totalDue = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Invoices &amp; Bills
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review your monthly billing statements, pay dues, or recharge in advance with bKash
          </p>
        </div>

        <button
          onClick={() => setAdvanceModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Pay Advance Bill</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Invoiced</span>
          <span className="text-2xl font-black text-white">৳{totalBilled.toLocaleString()}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Paid</span>
          <span className="text-2xl font-black text-emerald-400">৳{totalPaid.toLocaleString()}</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Due</span>
          <span className={`text-2xl font-black ${totalDue > 0 ? 'text-pink-400' : 'text-slate-300'}`}>
            ৳{totalDue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white mb-2">Monthly Invoices Statement</h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <span>Loading invoices statement...</span>
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic text-sm">
            No invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <th className="pb-3 pr-4">Invoice #</th>
                  <th className="pb-3 pr-4">Billing Month</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Paid</th>
                  <th className="pb-3 pr-4">Due</th>
                  <th className="pb-3 pr-4">Due Date</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">bKash Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isPaying = isPayingId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 pr-4 font-mono font-bold text-slate-300">INV-#{inv.id}</td>
                      <td className="py-4 pr-4 font-bold text-white text-sm">{inv.month}</td>
                      <td className="py-4 pr-4 text-slate-200">৳{inv.total}</td>
                      <td className="py-4 pr-4 text-emerald-400 font-semibold">৳{inv.paidAmount}</td>
                      <td className="py-4 pr-4 text-pink-400 font-semibold">৳{inv.dueAmount}</td>
                      <td className="py-4 pr-4 text-slate-400">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                      <td className="py-4 pr-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handlePay(inv.id)}
                            disabled={isPaying}
                            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#E2136E] hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md shadow-pink-600/20 transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isPaying ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Wait...</span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Pay ৳{inv.dueAmount} with bKash</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePrint(inv)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Advance Payment */}
      {advanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Pay Bill in Advance</h3>
                <p className="text-xs text-slate-400">Recharge upcoming months via bKash</p>
              </div>
              <button
                onClick={() => setAdvanceModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setAdvanceMonths(m);
                        setCustomAdvanceAmount('');
                      }}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        advanceMonths === m && !customAdvanceAmount
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {m} {m === 1 ? 'Month' : 'Months'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Or Custom Amount (৳)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={customAdvanceAmount}
                  onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleAdvancePay}
                  disabled={isPayingAdvance}
                  className="w-full py-3 bg-[#E2136E] hover:bg-pink-600 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-pink-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isPayingAdvance ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting bKash...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Proceed to bKash Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable receipt */}
      {selectedInvoice && (
        <div className="hidden print:block fixed inset-0 bg-white text-slate-900 p-8 z-50">
          <div className="max-w-md mx-auto border border-slate-300 rounded-2xl p-6 space-y-4 font-mono">
            <h2 className="text-xl font-bold text-center">ISP BROADBAND BILL RECEIPT</h2>
            <div className="border-b pb-2 text-xs space-y-1">
              <p><strong>Invoice ID:</strong> #{selectedInvoice.id}</p>
              <p><strong>Billing Month:</strong> {selectedInvoice.month}</p>
              <p><strong>Status:</strong> PAID</p>
              <p><strong>Total Amount:</strong> ৳{selectedInvoice.total}</p>
              <p><strong>Amount Paid:</strong> ৳{selectedInvoice.paidAmount}</p>
              <p><strong>Printed On:</strong> {new Date().toLocaleString()}</p>
            </div>
            <p className="text-[10px] text-center text-slate-500">Thank you for your timely bill payment!</p>
          </div>
        </div>
      )}
    </div>
  );
}
