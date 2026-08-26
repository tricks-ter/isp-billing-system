// frontend/src/pages/customer/CustomerDashboardPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customerPortalApi } from '../../services/customerPortalApi';
import {
  Wifi, Activity, Zap, CreditCard, ShieldCheck, AlertTriangle,
  CheckCircle2, ArrowUpRight, Clock, ArrowRight, Smartphone,
  Radio, LifeBuoy, FileText, Download, Loader2, Sparkles, Plus, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerDashboardPage() {
  const [isPaying, setIsPaying] = useState(false);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('advance'); // 'due' or 'advance'

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerDashboard'],
    queryFn: () => customerPortalApi.getDashboard().then(res => res.data.data),
    refetchInterval: 5000,
  });

  const handlePayBkash = async (options = {}) => {
    setIsPaying(true);
    try {
      let payload = {};
      if (options.invoiceId) {
        payload = { invoiceId: options.invoiceId };
      } else if (options.isAdvance) {
        payload = {
          isAdvance: true,
          monthsCount: options.monthsCount || advanceMonths || 1,
          customAmount: options.customAmount || (customAdvanceAmount ? parseFloat(customAdvanceAmount) : undefined),
        };
      } else if (hasDue && paymentMode === 'due' && firstDueInvoice) {
        payload = { invoiceId: firstDueInvoice.id };
      } else {
        payload = {
          isAdvance: true,
          monthsCount: advanceMonths || 1,
          customAmount: customAdvanceAmount ? parseFloat(customAdvanceAmount) : undefined,
        };
      }

      const res = await customerPortalApi.payBkash(payload);
      if (res.data?.data?.bkashURL) {
        window.location.href = res.data.data.bkashURL;
      } else {
        toast.error('Failed to obtain bKash checkout link. Please try again.');
        setIsPaying(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment initiation failed');
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Synchronizing live fiber connection &amp; billing metrics...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-2xl">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Unable to load dashboard</h3>
        <p className="text-xs text-slate-400 mb-6">Could not retrieve subscriber data from the network server.</p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { customer, liveSession, opticalSignal, billing, recentTickets } = data;
  const isSuspended = customer.status === 'SUSPENDED';
  const hasDue = billing.totalDue > 0;
  const firstDueInvoice = billing.unpaidInvoices?.[0];
  const pkgPrice = customer.package?.price || 500;
  const calculatedAdvanceTotal = customAdvanceAmount ? parseFloat(customAdvanceAmount) || pkgPrice : pkgPrice * advanceMonths;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-hidden">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {customer.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Package: <strong className="text-slate-200">{customer.package?.name} ({customer.package?.speed})</strong> • PPPoE: <code className="text-blue-400 font-semibold">{customer.pppoeUsername}</code>
          </p>
        </div>

        {/* Real-time Connection Status Indicator */}
        <div className="flex items-center space-x-2.5 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl w-fit shadow-md">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSuspended ? 'bg-amber-400' : (customer.status === 'ACTIVE' || liveSession.isOnline ? 'bg-emerald-400' : 'bg-rose-400')
            }`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              isSuspended ? 'bg-amber-500' : (customer.status === 'ACTIVE' || liveSession.isOnline ? 'bg-emerald-500' : 'bg-rose-500')
            }`} />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {isSuspended ? 'Suspended (Due Bill)' : (customer.status === 'ACTIVE' ? 'Active Connection' : (liveSession.isOnline ? 'Internet Active' : 'Session Offline'))}
          </span>
        </div>
      </div>

      {/* Hero: bKash Payment & Advance Recharge Hub */}
      <div className="bg-gradient-to-br from-[#1E112A] via-[#111827] to-[#0B0F19] border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#E2136E]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full text-[11px] font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>bKash Instant Broadband Payment</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {hasDue ? (
                  <>Current Outstanding Due: <span className="text-pink-400">৳{billing.totalDue.toLocaleString()}</span></>
                ) : (
                  <>Account Status: <span className="text-emerald-400">All Invoices Paid (৳0 Due)</span></>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Pay current dues or pay in advance for upcoming months. Successful payment instantly updates both your self-care portal and the ISP management dashboard.
              </p>
            </div>

            {/* Mode Switcher: Pay Due vs Pay Advance */}
            <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 self-start lg:self-center">
              {hasDue && (
                <button
                  type="button"
                  onClick={() => setPaymentMode('due')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    paymentMode === 'due' ? 'bg-[#E2136E] text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pay Due Bill (৳{billing.totalDue})
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaymentMode('advance')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentMode === 'advance' || !hasDue ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pay in Advance
              </button>
            </div>
          </div>

          {/* Advance Options Selector (when advance mode is active) */}
          {(paymentMode === 'advance' || !hasDue) && (
            <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Select Advance Billing Duration:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 6].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => {
                      setAdvanceMonths(months);
                      setCustomAdvanceAmount('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      advanceMonths === months && !customAdvanceAmount
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{months} {months === 1 ? 'Month' : 'Months'} Advance</div>
                    <div className="text-base font-black text-white mt-1">৳{(pkgPrice * months).toLocaleString()}</div>
                  </button>
                ))}
              </div>

              {/* Custom amount field */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs text-slate-400">Or Custom Advance Amount (৳):</span>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={customAdvanceAmount}
                  onChange={(e) => setCustomAdvanceAmount(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[160px]"
                />
              </div>
            </div>
          )}

          {/* Action Button: Pay with bKash */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={() => {
                if (paymentMode === 'due' && hasDue && firstDueInvoice) {
                  handlePayBkash({ invoiceId: firstDueInvoice.id });
                } else {
                  handlePayBkash({
                    isAdvance: true,
                    monthsCount: advanceMonths || 1,
                    customAmount: customAdvanceAmount ? parseFloat(customAdvanceAmount) : undefined,
                  });
                }
              }}
              disabled={isPaying}
              className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#E2136E] to-pink-600 hover:from-pink-600 hover:to-[#E2136E] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-pink-600/30 transition-all duration-200 disabled:opacity-70 cursor-pointer"
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to bKash Gateway...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>
                    Pay {paymentMode === 'due' && hasDue ? `৳${billing.totalDue}` : `৳${calculatedAdvanceTotal}`} with bKash
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <span className="text-xs text-slate-400 flex items-center space-x-1.5 self-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Official bKash Tokenized Checkout • Automated 24/7 Activation</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Interactive Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Live Internet Connection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broadband Speed</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-black text-white">{customer.package?.speed || '20 Mbps'}</div>
              <p className="text-xs text-slate-400 font-medium">{customer.package?.name}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Plan:</span>
                <span className="font-bold text-slate-200">৳{customer.package?.price} / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned IP:</span>
                <span className="font-mono text-slate-300">{liveSession.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Session Uptime:</span>
                <span className="font-medium text-emerald-400">{liveSession.uptime}</span>
              </div>
            </div>
          </div>

          <Link
            to="/portal/packages"
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Change / Upgrade Speed</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Optical Fiber Signal Health */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fiber Signal Health</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-white">
                {opticalSignal.rxPower !== null ? `${opticalSignal.rxPower} dBm` : 'Optimal'}
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                  opticalSignal.signalStatus === 'OPTIMAL' || opticalSignal.signalStatus === 'GOOD'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : opticalSignal.signalStatus === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {opticalSignal.signalStatus}
                </span>
                <span className="text-xs text-slate-400">Optical Rx Power</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ONU Model:</span>
                <span className="font-medium text-slate-200">{opticalSignal.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PON Port:</span>
                <span className="font-medium text-slate-200">Port {opticalSignal.portNumber || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Optical Tx:</span>
                <span className="font-mono text-slate-300">+{opticalSignal.txPower || 2.5} dBm</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Fiber core active with low jitter &amp; zero packet loss.</span>
          </div>
        </div>

        {/* Card 3: Support Desk */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Help &amp; Complaints</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <LifeBuoy className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-white">{recentTickets.length} Tickets</div>
              <p className="text-xs text-slate-400 font-medium">24/7 NOC Engineering Desk</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
              {recentTickets.length === 0 ? (
                <p className="text-slate-500 italic py-2">No active complaints or tickets.</p>
              ) : (
                recentTickets.slice(0, 2).map(ticket => (
                  <div key={ticket.id} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-200 truncate max-w-[150px]">{ticket.subject}</p>
                      <p className="text-[10px] text-slate-400">{ticket.ticketNo}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      ticket.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            to="/portal/tickets"
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>Create Support Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Invoices Statement</h3>
            <p className="text-xs text-slate-400">View and settle your monthly internet bills</p>
          </div>
          <Link
            to="/portal/invoices"
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                <th className="pb-3 pr-4">Month</th>
                <th className="pb-3 pr-4">Total Amount</th>
                <th className="pb-3 pr-4">Paid</th>
                <th className="pb-3 pr-4">Due Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">bKash Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {billing.recentInvoices.map((inv) => {
                const isPaid = inv.status === 'PAID';
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-white">{inv.month}</td>
                    <td className="py-3.5 pr-4 text-slate-200">৳{inv.total}</td>
                    <td className="py-3.5 pr-4 text-emerald-400 font-semibold">৳{inv.paidAmount}</td>
                    <td className="py-3.5 pr-4 text-slate-400">{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      {!isPaid ? (
                        <button
                          onClick={() => handlePayBkash({ invoiceId: inv.id })}
                          className="px-3 py-1.5 bg-[#E2136E] hover:bg-pink-600 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          bKash Pay
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Settled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
