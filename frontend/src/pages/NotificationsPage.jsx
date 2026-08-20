import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../services/notificationApi';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll({ page: 1, limit: 50 }).then(res => res.data.data),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifs']);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadNotifs']);
    },
  });

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'ERROR': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.pagination?.total || 0} total notifications
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark all as read</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading notifications...</div>
        ) : data?.notifications?.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No notifications yet</p>
            <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {data.notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 flex items-start space-x-4 hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className={`text-sm font-semibold ${!notif.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                      {notif.title}
                    </h3>
                    {!notif.isRead && (
                      <Badge variant="info">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(notif.createdAt).toLocaleString('en-GB', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </p>
                </div>
                {!notif.isRead && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notif.id)}
                    className="flex-shrink-0 text-xs text-primary hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}