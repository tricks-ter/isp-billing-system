// frontend/src/pages/customer/CustomerDashboardPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { customerPortalApi } from '../../services/customerPortalApi';
import BkashSandboxGuide from '../../components/BkashSandboxGuide';
import { formatMonthName, formatDisplayDate } from '../../utils/dateFormatter';
import {
  Wifi, Activity, Zap, CreditCard, ShieldCheck, AlertTriangle,
  CheckCircle2, ArrowUpRight, Clock, ArrowRight, Smartphone,
  Radio, LifeBuoy, FileText, Download, Loader2, Sparkles, Plus, Calendar, ToggleLeft, ToggleRight
} from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import toast from 'react-hot-toast';

export default function CustomerDashboardPage() {
  const [isPaying, setIsPaying] = useState(false);
  const [dateFormatMode, setDateFormatMode] = useState('month'); // 'month' or 'exact'
  const [customPayModalOpen, setCustomPayModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customMonths, setCustomMonths] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customerDashboard'],
    queryFn: () => customerPortalApi.getDashboard().then(res => res.data.data),
    refetchInterval: 5000,
  });

  const handlePayBkash = async (invoiceId) => {
    setIsPaying(true);
    try {
      const payload = invoiceId ? { invoiceId } : {};
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

  const handleCustomPay = async () => {
    setIsPaying(true);
    try {
      const payload = {
        isAdvance: true,
        monthsCount: customMonths,
        customAmount: customAmount ? parseFloat(customAmount) : undefined,
      };
      const res = await customerPortalApi.payBkash(payload);
      if (res.data?.data?.bkashURL) {
        window.location.href = res.data.data.bkashURL;
      } else {
        toast.error('Failed to obtain bKash checkout link');
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

  const { customer, liveSession = {}, opticalSignal = {}, billing = {}, recentTickets = [] } = data;
  const isSuspended = customer.status === 'SUSPENDED';
  const hasDue = (billing.totalDue || 0) > 0;
  const firstDueInvoice = (billing.unpaidInvoices || [])[0];
  const pkgPrice = customer.package?.price || 1000;
  const currentMonthName = formatMonthName(billing.currentMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);

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

      {/* Hero: Running Month Billing & 1-Click bKash Payment */}
      <div className="bg-gradient-to-br from-[#1E112A] via-[#111827] to-[#0B0F19] border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#E2136E]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-full text-[11px] font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Current Month Bill • {currentMonthName}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {hasDue ? (
                <>Due for {currentMonthName}: <span className="text-pink-400">৳{billing.totalDue.toLocaleString()}</span></>
              ) : (
                <>Bill for {currentMonthName}: <span className="text-emerald-400">Fully Paid (৳0 Due)</span></>
              )}
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {firstDueInvoice?.dueDate ? (
                <span>
                  Bill Due Date: <strong className="text-amber-300">{formatDisplayDate(firstDueInvoice.dueDate, 'month', true)}</strong>. Settle your running month internet bill instantly.
                </span>
              ) : (
                <span>Your account is in good standing with zero pending dues for {currentMonthName}.</span>
              )}
            </p>
          </div>

          {/* Action Button: Pay Bill (Current Due, Advance, or Custom Test Amount) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {hasDue ? (
              <button
                onClick={() => handlePayBkash(firstDueInvoice?.id)}
                disabled={isPaying}
                className="inline-flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-[#E2136E] to-pink-600 hover:from-pink-600 hover:to-[#E2136E] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-pink-600/30 transition-all duration-200 disabled:opacity-70 cursor-pointer"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connecting to bKash...</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    <span>Pay ৳{billing.totalDue.toLocaleString()} with bKash</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="px-5 py-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-bold text-xs sm:text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentMonthName} Bill Settled</span>
                </div>

                <button
                  onClick={() => handlePayBkash()}
                  disabled={isPaying}
                  className="inline-flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-[#E2136E] to-pink-600 hover:from-pink-600 hover:to-[#E2136E] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-pink-600/30 transition-all duration-200 disabled:opacity-70 cursor-pointer"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to bKash...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Pay Next Month (৳{pkgPrice})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setCustomPayModalOpen(true)}
              className="px-4 py-3.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center space-x-1.5"
              title="Test custom amount with bKash sandbox"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Custom Test Pay</span>
            </button>
          </div>
        </div>

        {/* Embedded Sandbox Test Instructions */}
        <BkashSandboxGuide />
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
                <span className="font-mono text-slate-300">{liveSession.ipAddress || '10.10.x.x'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Session Uptime:</span>
                <span className="font-medium text-emerald-400">{liveSession.uptime || 'Active'}</span>
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
                  {opticalSignal.signalStatus || 'OPTIMAL'}
                </span>
                <span className="text-xs text-slate-400">Optical Rx Power</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">ONU Model:</span>
                <span className="font-medium text-slate-200">{opticalSignal.model || 'Standard GPON'}</span>
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
              <div className="text-3xl font-black text-white">{(recentTickets || []).length} Tickets</div>
              <p className="text-xs text-slate-400 font-medium">24/7 NOC Engineering Desk</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
              {(recentTickets || []).length === 0 ? (
                <p className="text-slate-500 italic py-2">No active complaints or tickets.</p>
              ) : (
                (recentTickets || []).slice(0, 2).map(ticket => (
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

      {/* Recent Invoices Table with Date Format Toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white">Monthly Invoices Statement</h3>
            <p className="text-xs text-slate-400">View and settle your monthly internet bills</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Toggle Button: Month Name vs Exact Date */}
            <button
              onClick={() => setDateFormatMode(dateFormatMode === 'month' ? 'exact' : 'month')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 flex items-center space-x-1.5 transition cursor-pointer"
              title="Switch date format display"
            >
              {dateFormatMode === 'month' ? (
                <>
                  <ToggleLeft className="w-4 h-4 text-blue-400" />
                  <span>Month View (e.g. {currentMonthName})</span>
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4 text-emerald-400" />
                  <span>Exact Date (DD/MM/YYYY)</span>
                </>
              )}
            </button>

            <Link
              to="/portal/invoices"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>All Invoices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                <th className="pb-3 pr-4">Billing Month</th>
                <th className="pb-3 pr-4">Total Amount</th>
                <th className="pb-3 pr-4">Paid</th>
                <th className="pb-3 pr-4">Due Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(billing?.recentInvoices || billing?.unpaidInvoices || []).map((inv) => {
                const isPaid = inv.status === 'PAID';
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pr-4 font-bold text-white">
                      {dateFormatMode === 'month' ? formatMonthName(inv.month) : inv.month}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-200">৳{inv.total}</td>
                    <td className="py-3.5 pr-4 text-emerald-400 font-semibold">৳{inv.paidAmount}</td>
                    <td className="py-3.5 pr-4 text-slate-400">
                      {formatDisplayDate(inv.dueDate, dateFormatMode, true)}
                    </td>
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
                          onClick={() => handlePayBkash(inv.id)}
                          className="px-3 py-1.5 bg-[#E2136E] hover:bg-pink-600 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        >
                          Pay with bKash
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

      {/* Custom & Advance Payment Modal */}
      <Modal
        isOpen={customPayModalOpen}
        onClose={() => setCustomPayModalOpen(false)}
        title="Pay Bill / Advance Recharge with bKash"
      >
        <div className="space-y-5 text-sm text-slate-800 dark:text-slate-200">
          <div className="bg-pink-50 dark:bg-pink-950/40 p-4 rounded-2xl border border-pink-200 dark:border-pink-800/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs text-pink-700 dark:text-pink-300">Package Monthly Rate</span>
              <span className="font-black text-pink-600 dark:text-pink-400 text-base">৳{pkgPrice} / mo</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You can pay for 1 or more upcoming months, or enter a custom amount to test the bKash payment gateway.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
              Months to Recharge
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCustomMonths(m);
                    setCustomAmount(String(pkgPrice * m));
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    customMonths === m && (!customAmount || customAmount === String(pkgPrice * m))
                      ? 'bg-[#E2136E] text-white border-[#E2136E] shadow-md shadow-pink-600/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m} Month{m > 1 ? 's' : ''} (৳{pkgPrice * m})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
              Or Enter Custom Test Amount (৳)
            </label>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={`Default: ৳${pkgPrice * customMonths}`}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setCustomPayModalOpen(false)} type="button">
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleCustomPay}
              disabled={isPaying}
              className="px-6 py-2.5 bg-gradient-to-r from-[#E2136E] to-pink-600 hover:from-pink-600 hover:to-[#E2136E] text-white font-extrabold text-xs rounded-xl shadow-lg transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              <span>Pay ৳{customAmount || (pkgPrice * customMonths)} with bKash</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
