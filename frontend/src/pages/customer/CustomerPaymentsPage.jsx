// frontend/src/pages/customer/CustomerPaymentsPage.jsx
import { useQuery } from '@tanstack/react-query';
import { customerPortalApi } from '../../services/customerPortalApi';
import {
  Receipt, Smartphone, Wallet, Building2, CheckCircle2,
  Printer, Loader2, Calendar, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerPaymentsPage() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['customerPayments'],
    queryFn: () => customerPortalApi.getPayments().then(res => res.data.data),
  });

  const getMethodBadge = (method) => {
    switch (method) {
      case 'BKASH':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Smartphone className="w-3 h-3" />
            <span>bKash Online</span>
          </span>
        );
      case 'NAGAD':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Smartphone className="w-3 h-3" />
            <span>Nagad</span>
          </span>
        );
      case 'BANK':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Building2 className="w-3 h-3" />
            <span>Bank Transfer</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
            <Wallet className="w-3 h-3" />
            <span>Cash Collection</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Payment Receipts &amp; History
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Detailed ledger of all verified subscription payments made to your account
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-white mb-2">Verified Payment Transactions</h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <span>Loading payment records...</span>
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic text-sm">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <th className="pb-3 pr-4">Payment ID</th>
                  <th className="pb-3 pr-4">Date &amp; Time</th>
                  <th className="pb-3 pr-4">Invoice Month</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">TrxID / Reference</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 pr-4 font-mono font-bold text-slate-300">PAY-#{p.id}</td>
                    <td className="py-4 pr-4 text-slate-300">
                      {new Date(p.date).toLocaleString('en-GB')}
                    </td>
                    <td className="py-4 pr-4 font-bold text-white">
                      {p.invoice?.month || 'Subscription'}
                    </td>
                    <td className="py-4 pr-4 text-emerald-400 font-extrabold text-sm">
                      ৳{p.amount.toLocaleString()}
                    </td>
                    <td className="py-4 pr-4">
                      {getMethodBadge(p.method)}
                    </td>
                    <td className="py-4 pr-4 font-mono">
                      {p.trxId ? (
                        <div className="flex items-center space-x-1.5">
                          <span className="text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 select-all">
                            {p.trxId}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.trxId);
                              toast.success(`Copied TrxID: ${p.trxId}`);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
                            title="Copy TrxID"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">{p.gatewayPaymentId || 'Cash Settlement'}</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Success</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

