import { Users, CreditCard, Wifi, AlertTriangle } from 'lucide-react';

const stats = [
  { label: 'Total Customers', value: '1,248', icon: Users, color: 'bg-blue-500', change: '+12%' },
  { label: 'Active Now', value: '892', icon: Wifi, color: 'bg-green-500', change: '+5%' },
  { label: 'Due Payments', value: '৳ 45,200', icon: CreditCard, color: 'bg-amber-500', change: '-3%' },
  { label: 'Suspended', value: '23', icon: AlertTriangle, color: 'bg-red-500', change: '+2' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-2 font-medium">{stat.change} from last month</p>
          </div>
        ))}
      </div>

      {/* Placeholder for charts and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Overview</h3>
          <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
            Chart coming soon...
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {['Customer "Rahim" paid ৳1,000 via bKash', 'Invoice #2026-08-001 generated', 'Customer "Karim" suspended (overdue)'].map((item, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <p className="text-sm text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}