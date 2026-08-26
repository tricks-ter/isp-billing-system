import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { invoiceApi } from '../services/invoiceApi';
import { activityApi } from '../services/activityApi';
import { oltApi } from '../services/oltApi';
import { Users, Wifi, CreditCard, AlertTriangle, TrendingUp, TrendingDown, Layers, Radio, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useAuthStore from '../store/authStore';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  const { data: customersData } = useQuery({
    queryKey: ['customers', { page: 1, limit: 1 }],
    queryFn: () => customerApi.getAll({ page: 1, limit: 1 }).then(res => res.data.data),
  });

  const { data: opticalSummary } = useQuery({
    queryKey: ['opticalSummary'],
    queryFn: () => oltApi.getOpticalSummary().then(res => res.data.data),
    staleTime: 60000,
  });

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { data: summaryData } = useQuery({
    queryKey: ['invoiceSummary', currentMonth],
    queryFn: () => invoiceApi.getMonthlySummary(currentMonth).then(res => res.data.data),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: () => activityApi.getRecent(5).then(res => res.data.data),
    refetchInterval: 30000,
  });

  const totalCustomers = customersData?.pagination?.total || 0;
  const activeCustomers = customersData?.customers?.filter(c => c.status === 'ACTIVE').length || 0;
  const suspendedCustomers = customersData?.customers?.filter(c => c.status === 'SUSPENDED').length || 0;
  const dueAmount = summaryData?.totalDue || 0;

  const revenueData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 67000 },
    { month: 'Jul', revenue: 72000 },
    { month: 'Aug', revenue: summaryData?.totalPaid || 68000 },
  ];

  const statusData = [
    { name: 'Active', value: activeCustomers || 85 },
    { name: 'Suspended', value: suspendedCustomers || 10 },
    { name: 'Expired', value: 5 },
  ];

  const stats = [
    {
      label: 'Total Customers',
      value: totalCustomers.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      trend: 'up',
    },
    {
      label: 'Active Now',
      value: activeCustomers.toLocaleString(),
      icon: Wifi,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+5%',
      trend: 'up',
    },
    {
      label: 'Due Payments',
      value: `৳${dueAmount.toLocaleString()}`,
      icon: CreditCard,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      change: '-3%',
      trend: 'down',
    },
    {
      label: 'Suspended',
      value: suspendedCustomers.toLocaleString(),
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      change: '+2',
      trend: 'up',
    },
  ];

  const formatActivityMessage = (activity) => {
    try {
      const details = JSON.parse(activity.details || '{}');
      
      switch (activity.action) {
        case 'GENERATE_INVOICES':
          return `Generated ${details.results?.created || 0} invoices (${details.results?.skipped || 0} skipped) for ${details.month}`;
        case 'CREATE_CUSTOMER':
          return `Created new customer: ${details.name}`;
        case 'UPDATE_CUSTOMER':
          return `Updated customer: ${details.name}`;
        case 'DELETE_CUSTOMER':
          return `Deleted customer: ${details.name}`;
        case 'SUSPEND_CUSTOMER':
          return `Suspended customer: ${details.name}`;
        case 'RESTORE_CUSTOMER':
          return `Restored customer: ${details.name}`;
        case 'RECORD_PAYMENT':
          return `Recorded payment of ৳${details.amount} via ${details.method}`;
        case 'LOGIN':
          return `User ${details.username} logged in`;
        case 'LOGOUT':
          return `User ${details.username} logged out`;
        case 'BULK_SUSPEND':
          return `Bulk suspended ${details.results?.success || 0} customers (${details.results?.failed || 0} failed)`;
        case 'BULK_RESTORE':
          return `Bulk restored ${details.results?.success || 0} customers (${details.results?.failed || 0} failed)`;
        case 'CREATE_PACKAGE':
          return `Created package: ${details.name}`;
        case 'CREATE_ROUTER':
          return `Added router: ${details.name}`;
        default:
          return activity.action.replace(/_/g, ' ');
      }
    } catch (error) {
      return activity.action.replace(/_/g, ' ');
    }
  };

  const recentActivities = activityData?.logs?.map(log => ({
    id: log.id,
    text: formatActivityMessage(log),
    time: new Date(log.createdAt).toLocaleString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    }),
    type: log.action.toLowerCase().includes('payment') ? 'payment' : 
          log.action.toLowerCase().includes('customer') ? 'customer' : 
          log.action.toLowerCase().includes('invoice') ? 'invoice' : 'system',
    user: log.user?.fullName || 'System',
  })) || [];

  const getActivityIcon = (type) => {
    const icons = {
      payment: '💰',
      customer: '👤',
      invoice: '📄',
      system: '⚙️',
    };
    return icons[type] || '📌';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening with your ISP today
          </p>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          📅 {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} dark:bg-opacity-20 p-2.5 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Revenue Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly collection trend</p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-slate-600 dark:text-slate-300">Revenue</span>
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `৳${value/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`৳${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Customer Status</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Distribution overview</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {statusData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optical & OLT Network Health Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">FTTH & OLT Optical Health</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live fiber power and access node status</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary">
            {opticalSummary?.totalOlts ?? 0} OLT Nodes Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold block">Optimal Signal (&gt; -24 dBm)</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {opticalSummary?.opticalDistribution?.optimal ?? 0} ONUs
              </span>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block">Marginal (-24 to -27 dBm)</span>
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">
                {opticalSummary?.opticalDistribution?.marginal ?? 0} ONUs
              </span>
            </div>
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-red-800 dark:text-red-300 font-semibold block">Critical / LOS (&lt; -27 dBm)</span>
              <span className="text-xl font-bold text-red-700 dark:text-red-300">
                {opticalSummary?.opticalDistribution?.critical ?? 0} ONUs
              </span>
            </div>
            <Radio className="w-6 h-6 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest system events</p>
          </div>
          <button className="text-sm text-primary hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {activityLoading ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-4">Loading activities...</div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-4">No recent activities found</div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="text-xl flex-shrink-0">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate" title={activity.text}>
                    {activity.text}
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{activity.user}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}