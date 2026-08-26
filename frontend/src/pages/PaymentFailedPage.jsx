// frontend/src/pages/PaymentFailedPage.jsx
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, Wifi, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Payment could not be completed';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="max-w-lg w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Payment Unsuccessful</h1>
            <p className="text-xs text-slate-400">Transaction Status</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">Payment Failed / Cancelled</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              {decodeURIComponent(message)}
            </p>
          </div>

          <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl text-left flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              No money was deducted from your bKash account. If money was charged, bKash will automatically refund it within 24 hours.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => window.history.back()}
              className="flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-pink-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <Link
              to="/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return Home</span>
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

