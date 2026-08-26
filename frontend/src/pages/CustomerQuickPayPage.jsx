// frontend/src/pages/CustomerQuickPayPage.jsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bkashApi } from '../services/bkashApi';
import { Wifi, CheckCircle2, AlertCircle, Calendar, User, Phone, MapPin, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerQuickPayPage() {
  const { token } = useParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: invoice, isLoading, isError, error } = useQuery({
    queryKey: ['publicInvoice', token],
    queryFn: () => bkashApi.getPublicInvoice(token).then((res) => res.data.data),
    retry: 1,
  });

  const handleBkashPay = async () => {
    if (!invoice || invoice.dueAmount <= 0) return;
    setIsProcessing(true);

    try {
      const response = await bkashApi.createPayment({
        invoiceId: invoice.id,
        payerReference: invoice.customer?.phone,
      });

      if (response.data?.data?.bkashURL) {
        // Redirect browser to bKash PGW or simulation URL
        window.location.href = response.data.data.bkashURL;
      } else {
        toast.error('Failed to get bKash payment URL');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('bKash Payment Error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate bKash payment');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading invoice details...</p>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl">
          <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invoice Not Found</h2>
          <p className="text-slate-400 text-sm mb-6">
            {error?.response?.data?.message || 'This payment link is invalid, expired, or has already been closed.'}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
          >
            Go to ISP Portal
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'PAID' || invoice.dueAmount <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ISP Bill Payment</h1>
            <p className="text-xs text-slate-400">Secure Online Self-Care Portal</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/60 border border-slate-700/60 rounded-full text-[11px] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-xl w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Top Status Banner */}
          <div className={`p-4 sm:p-5 flex items-center justify-between ${
            isPaid
              ? 'bg-emerald-950/40 border-b border-emerald-800/40 text-emerald-300'
              : 'bg-gradient-to-r from-pink-950/40 via-rose-950/30 to-slate-900 border-b border-pink-800/30 text-pink-300'
          }`}>
            <div className="flex items-center space-x-2.5">
              {isPaid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
              )}
              <span className="text-sm font-semibold">
                {isPaid ? 'This Bill is Fully Paid' : 'Payment Due for Internet Service'}
              </span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/50 text-slate-300">
              Month: {invoice.month}
            </span>
          </div>

          {/* Amount Due Section */}
          <div className="p-6 text-center border-b border-slate-800/80 bg-slate-950/40">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
              {isPaid ? 'Total Paid Amount' : 'Amount to Pay'}
            </span>
            <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight flex items-center justify-center">
              <span className="text-pink-500 mr-1">৳</span>
              {isPaid ? invoice.total.toLocaleString() : invoice.dueAmount.toLocaleString()}
            </div>
            {!isPaid && invoice.totalPaid > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Total Bill: ৳{invoice.total} • Already Paid: ৳{invoice.totalPaid}
              </p>
            )}
          </div>

          {/* Customer & Package Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Customer Name
                </span>
                <span className="font-semibold text-white block truncate">{invoice.customer?.name}</span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number
                </span>
                <span className="font-semibold text-white block">{invoice.customer?.phone}</span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" /> Internet Package
                </span>
                <span className="font-semibold text-white block">
                  {invoice.customer?.package?.name} ({invoice.customer?.package?.speed})
                </span>
              </div>

              <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
                </span>
                <span className="font-semibold text-white block">
                  {new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Pay Button / Receipt Button */}
            <div className="pt-3">
              {isPaid ? (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-center">
                  <p className="text-sm font-medium text-emerald-300 mb-1">
                    Thank you! Your internet connection is active.
                  </p>
                  <p className="text-xs text-slate-400">
                    If you have any questions, please contact our support hotline.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleBkashPay}
                  disabled={isProcessing}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#E2136E] to-[#D12053] hover:from-[#c70f5e] hover:to-[#b81645] text-white font-bold text-base sm:text-lg shadow-xl shadow-pink-600/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-3 disabled:opacity-60 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Connecting to bKash Gateway...</span>
                    </>
                  ) : (
                    <>
                      {/* bKash Icon / Text */}
                      <span className="bg-white text-[#E2136E] text-xs font-black px-2 py-0.5 rounded shadow-sm">
                        bKash
                      </span>
                      <span>bKash দিয়ে পরিশোধ করুন (Pay ৳{invoice.dueAmount})</span>
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-center text-[11px] text-slate-500 pt-1">
              Supports bKash Personal Accounts &amp; Instant Auto-Restoration
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        <p>© {new Date().getFullYear()} ISP Management System • Powered by bKash PGW</p>
      </footer>
    </div>
  );
}

