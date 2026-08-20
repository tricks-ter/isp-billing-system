import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { invoiceApi } from '../services/invoiceApi';
import { Users, Wifi, CreditCard, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useAuthStore from '../store/authStore';

const COLORS = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  // Fetch real stats
  const { data: customersData } = useQuery({
    queryKey: ['customers', { page: 1, limit: 1 }],
    queryFn: () => customerApi.getAll({ page: 1, limit: 1 }).then(res => res.data.data),
  });

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const { data: summaryData } = useQuery({
    queryKey: ['invoiceSummary', currentMonth],
    queryFn: () => invoiceApi.getMonthlySummary(currentMonth).then(res => res.data.data),
  });

  const totalCustomers = customersData?.pagination?.total || 0;
  const activeCustomers = customersData?.customers?.filter(c => c.status === 'ACTIVE').length || 0;
  const suspendedCustomers = customersData?.customers?.filter(c => c.status === 'SUSPENDED').length || 0;
  const dueAmount = summaryData?.totalDue || 0;

  // Mock revenue data for chart (replace with real data later)
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

  const recentActivities = [
    { id: 1, text: 'Customer "Rahim" paid ৳1,000 via bKash', time: '2 hours ago', type: 'payment' },
    { id: 2, text: 'Invoice #2026-08-001 generated', time: '5 hours ago', type: 'invoice' },
    { id: 3, text: 'Customer "Karim" suspended (overdue)', time: '1 day ago', type: 'suspend' },
    { id: 4, text: 'New package "Premium 100Mbps" created', time: '2 days ago', type: 'package' },
  ];

  const getActivityIcon = (type) => {
    const icons = {
      payment: '💰',
      invoice: '',
      suspend: '️',
      package: '',
    };
    return icons[type] || '📌';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your ISP today
          </p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
          📅 {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-2.5 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Revenue Overview</h3>
              <p className="text-sm text-slate-500">Monthly collection trend</p>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-slate-600">Revenue</span>
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

        {/* Status Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Customer Status</h3>
            <p className="text-sm text-slate-500">Distribution overview</p>
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
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <p className="text-sm text-slate-500">Latest system events</p>
          </div>
          <button className="text-sm text-primary hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="text-xl flex-shrink-0">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{activity.text}</p>
                <p className="text-xs text-slate-500 mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}