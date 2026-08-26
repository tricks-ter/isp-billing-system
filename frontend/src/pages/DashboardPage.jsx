// frontend/src/pages/DashboardPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { invoiceApi } from '../services/invoiceApi';
import { activityApi } from '../services/activityApi';
import { oltApi } from '../services/oltApi';
import {
  Users, Wifi, CreditCard, AlertTriangle, TrendingUp, TrendingDown,
  Layers, Radio, CheckCircle2, Phone, DollarSign, Wallet, ArrowUpRight,
  Sparkles, X, MessageSquare, ExternalLink, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  const [drillDownCard, setDrillDownCard] = useState(null); // 'TOTAL', 'PAID', 'DUE', 'EXPECTED', 'COLLECTED', 'OUTSTANDING'

  const { data: collectionSummary, refetch: refetchCollection } = useQuery({
    queryKey: ['collectionSummaryDashboard'],
    queryFn: () => customerApi.getCollectionSummary().then(res => res.data.data),
    refetchInterval: 5000,
  });

  const { data: customerStats, refetch: refetchStats } = useQuery({
    queryKey: ['customerStats'],
    queryFn: () => customerApi.getStats().then(res => res.data.data),
    refetchInterval: 5000,
  });

  const { data: opticalSummary, refetch: refetchOptical } = useQuery({
    queryKey: ['opticalSummary'],
    queryFn: () => oltApi.getOpticalSummary().then(res => res.data.data),
    refetchInterval: 10000,
  });

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['invoiceSummary', currentMonth],
    queryFn: () => invoiceApi.getMonthlySummary(currentMonth).then(res => res.data.data),
    refetchInterval: 5000,
  });

  const { data: activityData, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => activityApi.getRecent(5).then(res => res.data.data?.logs || (Array.isArray(res.data.data) ? res.data.data : [])),
    refetchInterval: 5000,
  });

  // Comprehensive Metrics
  const totalCust = collectionSummary?.totalCustomers ?? (customerStats?.total || 0);
  const paidCust = collectionSummary?.paidCount ?? 0;
  const dueCust = collectionSummary?.dueCount ?? 0;
  const expectedRev = collectionSummary?.expectedMonthlyRevenue ?? 0;
  const collectedRev = collectionSummary?.actualCollectedRevenue ?? (summaryData?.totalPaid || 0);
  const outstandingDue = collectionSummary?.totalOutstandingDue ?? (summaryData?.totalDue || 0);
  const collectionEfficiency = collectionSummary?.collectionEfficiency ?? 100;

  const handleRefreshAll = () => {
    refetchCollection();
    refetchStats();
    refetchSummary();
    refetchActivity();
    refetchOptical();
  };

  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 },
    { month: 'Jul', revenue: 72000 },
    { month: 'Aug', revenue: collectedRev || 68000 },
  ];

  const statusData = [
    { name: 'Paid / Active', value: paidCust || 1 },
    { name: 'Due / Unpaid', value: dueCust || 0 },
    { name: 'Suspended', value: customerStats?.suspended || 0 },
  ];

  const getDrillDownTitle = () => {
    switch (drillDownCard) {
      case 'TOTAL': return `All Subscribers (${totalCust})`;
      case 'PAID': return `Paid Subscribers This Month (${paidCust})`;
      case 'DUE': return `Due / Overdue Customers (${dueCust})`;
      case 'EXPECTED': return `Expected Monthly Billing Potential (৳${expectedRev.toLocaleString()})`;
      case 'COLLECTED': return `Actual Collected Revenue This Month (৳${collectedRev.toLocaleString()})`;
      case 'OUTSTANDING': return `Outstanding Due & Balance (৳${outstandingDue.toLocaleString()})`;
      default: return 'Customer Details';
    }
  };

  const getDrillDownList = () => {
    if (!collectionSummary?.lists) return [];
    switch (drillDownCard) {
      case 'TOTAL':
      case 'EXPECTED':
        return collectionSummary.lists.all || [];
      case 'PAID':
      case 'COLLECTED':
        return collectionSummary.lists.paid || [];
      case 'DUE':
      case 'OUTSTANDING':
        return collectionSummary.lists.due || [];
      default:
        return collectionSummary.lists.all || [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Live Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <span>Welcome back, {firstName}</span>
            <span className="text-2xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time subscriber metrics, revenue collection, optical health, and billing status
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Live Sync Active</span>
          </div>

          <button
            onClick={handleRefreshAll}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh All Real-Time Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Interactive Intelligence Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Subscribers */}
        <div
          onClick={() => setDrillDownCard('TOTAL')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Subscribers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 block">
            {totalCust}
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-0.5 mt-1 group-hover:underline">
            <span>View All</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 2: Paid Subscribers */}
        <div
          onClick={() => setDrillDownCard('PAID')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Paid (This Month)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 block">
            {paidCust}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-0.5 mt-1 group-hover:underline">
            <span>Active &amp; Paid</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 3: Due Subscribers */}
        <div
          onClick={() => setDrillDownCard('DUE')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-rose-500 dark:hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Due Subscribers</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 block">
            {dueCust}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center space-x-0.5 mt-1 group-hover:underline">
            <span>{dueCust > 0 ? 'Dial & Collect' : 'Zero Dues'}</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 4: Expected Revenue */}
        <div
          onClick={() => setDrillDownCard('EXPECTED')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Expected Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 block truncate">
            ৳{expectedRev.toLocaleString()}
          </span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center space-x-0.5 mt-1 group-hover:underline">
            <span>Billing Potential</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 5: Collected Revenue */}
        <div
          onClick={() => setDrillDownCard('COLLECTED')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Collected Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 block truncate">
            ৳{collectedRev.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-0.5 mt-1 group-hover:underline">
            <span>Received This Month</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Card 6: Outstanding Dues */}
        <div
          onClick={() => setDrillDownCard('OUTSTANDING')}
          className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-amber-500 dark:hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Outstanding Due</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 block truncate">
            ৳{outstandingDue.toLocaleString()}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-0.5 mt-1 group-hover:underline">
            <span>{collectionEfficiency}% Efficiency</span>
            <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Revenue Trend & Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Revenue &amp; Collections Trend</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monthly broadband collection volume</p>
            </div>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `৳${v/1000}k`} />
                <Tooltip formatter={(value) => [`৳${value.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Subscriber Status Distribution</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Paid vs Unpaid vs Suspended</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/80 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{paidCust}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Due</span>
              <span className="text-sm font-bold text-amber-500">{dueCust}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Suspended</span>
              <span className="text-sm font-bold text-red-500">{customerStats?.suspended || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optical Health & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Optical FTTH Health */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">FTTH Optical Signal Health</h2>
            </div>
            <Link to="/olts" className="text-xs font-bold text-primary hover:underline flex items-center space-x-1">
              <span>Manage OLTs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">Optimal (&gt;-24dBm)</span>
              <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{opticalSummary?.optimal || 0}</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 block">Good (-27 to -24)</span>
              <span className="text-xl font-black text-blue-700 dark:text-blue-400">{opticalSummary?.good || 0}</span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">Warning (&lt;-27dBm)</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-400">{opticalSummary?.warning || 0}</span>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400 block">LOS / Critical</span>
              <span className="text-xl font-black text-rose-700 dark:text-rose-400">{(opticalSummary?.critical || 0) + (opticalSummary?.los || 0)}</span>
            </div>
          </div>
        </div>

        {/* Real-time System Feed */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Live NOC Audit Activity</h2>
            <Link to="/audit-logs" className="text-xs font-bold text-primary hover:underline flex items-center space-x-1">
              <span>View Logs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {((Array.isArray(activityData) ? activityData : activityData?.logs) || []).map((item) => {
              let detailStr = '';
              try {
                if (item.details) {
                  const p = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
                  detailStr = typeof p === 'object' ? JSON.stringify(p) : String(p);
                }
              } catch (_) {
                detailStr = String(item.details || '');
              }

              return (
                <div key={item.id} className="flex items-start space-x-3 text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 font-medium truncate">
                      {item.action?.replace(/_/g, ' ')}: {detailStr}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleString('en-GB')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Drill-Down Modal */}
      {drillDownCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {getDrillDownTitle()}
                </h3>
                <p className="text-xs text-slate-500">Live subscriber records and collection breakdown</p>
              </div>
              <button
                onClick={() => setDrillDownCard(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {getDrillDownList().length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No subscribers in this category.
                </div>
              ) : (
                getDrillDownList().map((cust) => (
                  <div
                    key={cust.id}
                    className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cust.name}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          cust.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'
                        }`}>
                          {cust.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <a
                          href={`tel:${cust.phone}`}
                          className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-mono font-bold hover:underline"
                          title="Click to dial"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{cust.phone}</span>
                        </a>
                        <span>•</span>
                        <span>PPPoE: <strong className="font-mono text-slate-700 dark:text-slate-300">{cust.pppoeUsername}</strong></span>
                        <span>•</span>
                        <span>Plan: <strong className="text-primary">{cust.packageName}</strong></span>
                      </div>
                      {cust.collectionNote && (
                        <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2 rounded-lg text-slate-800 dark:text-slate-200">
                          <span className="font-bold text-amber-700 dark:text-amber-400 text-[10px] block uppercase">Note:</span>
                          {cust.collectionNote}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Package / Due</span>
                        <span className="font-black text-sm text-slate-900 dark:text-slate-100">৳{cust.packagePrice}</span>
                        {cust.dueAmount > 0 && (
                          <span className="text-xs font-bold text-rose-600 block">Due: ৳{cust.dueAmount}</span>
                        )}
                      </div>

                      <a
                        href={`tel:${cust.phone}`}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow cursor-pointer"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end flex-shrink-0">
              <button
                onClick={() => setDrillDownCard(null)}
                className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}