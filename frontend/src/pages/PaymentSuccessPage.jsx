// frontend/src/pages/PaymentSuccessPage.jsx
import { useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Wifi, ShieldCheck, Printer, ArrowLeft, Calendar, FileText } from 'lucide-react';
import useCustomerAuthStore from '../store/customerAuthStore';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isCustomerAuth = useCustomerAuthStore((state) => state.isAuthenticated);

  const trxID = searchParams.get('trxID') || 'N/A';
  const amount = searchParams.get('amount') || '0';
  const customer = searchParams.get('customer') || 'Valued Subscriber';
  const invoiceId = searchParams.get('invoiceId') || '';

  useEffect(() => {
    // Invalidate all related queries to force immediate real-time sync across system
    queryClient.invalidateQueries();
  }, [queryClient]);

  const handlePrint = () => {
    window.print();
  };

  const returnPath = isCustomerAuth ? '/portal/dashboard' : '/dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="max-w-lg w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Payment Confirmation</h1>
            <p className="text-xs text-slate-400">Official Payment Receipt</p>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/60 border border-emerald-800/60 rounded-full text-[11px] text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Paid</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
            <p className="text-sm text-slate-400 mt-1">
              Thank you, <span className="font-semibold text-slate-200">{decodeURIComponent(customer)}</span>. Your internet connection is active!
            </p>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 uppercase tracking-wider block mb-0.5">Amount Paid</span>
            <span className="text-3xl font-extrabold text-emerald-400">৳{amount}</span>
          </div>

          {/* Receipt Table */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2.5 text-left font-mono">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">bKash TrxID:</span>
              <span className="font-bold text-white">{trxID}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400 font-sans">Payment Method:</span>
              <span className="text-pink-400 font-bold">bKash Payment Gateway</span>
            </div>
            {invoiceId && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-sans">Invoice ID:</span>
                <span className="text-slate-200">#{invoiceId}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-sans">Date &amp; Time:</span>
              <span className="text-slate-300">{new Date().toLocaleString('en-GB')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            <Link
              to={returnPath}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-lg w-full mx-auto text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        <p>© {new Date().getFullYear()} ISP Management System</p>
      </footer>
    </div>
  );
}
