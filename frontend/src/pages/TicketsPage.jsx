// frontend/src/pages/TicketsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../services/ticketApi';
import {
  LifeBuoy, Search, Filter, MessageSquare, CheckCircle2,
  Clock, AlertTriangle, AlertCircle, Trash2, Send, X,
  User, Phone, Wifi, Radio, Shield, Loader2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TicketsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [replyPriority, setReplyPriority] = useState('MEDIUM');

  const queryClient = useQueryClient();

  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['ticketStats'],
    queryFn: () => ticketApi.getStats().then(res => res.data.data),
    refetchInterval: 10000,
  });

  const { data: ticketsData, isLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['adminTickets', search, statusFilter, priorityFilter],
    queryFn: () => ticketApi.getAll({
      search,
      status: statusFilter,
      priority: priorityFilter,
      limit: 50,
    }).then(res => res.data.data),
    refetchInterval: 10000,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => ticketApi.update(id, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Support ticket updated successfully');
      queryClient.invalidateQueries(['adminTickets']);
      queryClient.invalidateQueries(['ticketStats']);
      setSelectedTicket(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update ticket');
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id) => ticketApi.delete(id),
    onSuccess: () => {
      toast.success('Ticket deleted successfully');
      queryClient.invalidateQueries(['adminTickets']);
      queryClient.invalidateQueries(['ticketStats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete ticket');
    },
  });

  const handleOpenReplyModal = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.adminReply || '');
    setReplyStatus(ticket.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS');
    setReplyPriority(ticket.priority);
  };

  const handleSaveReply = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      data: {
        status: replyStatus,
        priority: replyPriority,
        adminReply: replyText.trim(),
      },
    });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800">Urgent</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">High</span>;
      case 'LOW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Low</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">Medium</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center space-x-1 w-fit"><CheckCircle2 className="w-3 h-3" /><span>Resolved</span></span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center space-x-1 w-fit"><Clock className="w-3 h-3" /><span>In Progress</span></span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 w-fit">Closed</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center space-x-1 w-fit"><AlertCircle className="w-3 h-3" /><span>Open</span></span>;
    }
  };

  const tickets = ticketsData?.tickets || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Support Desk &amp; Customer Complaints
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage subscriber issues, fiber cut tickets, speed upgrade requests, and engineering replies
          </p>
        </div>

        <button
          onClick={() => { refetchStats(); refetchTickets(); }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-fit cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Tickets</span>
            <LifeBuoy className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {statsData?.total || 0}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-600 uppercase">Open / Pending</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {statsData?.open || 0}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase">In Progress</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {statsData?.inProgress || 0}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-green-600 uppercase">Resolved</span>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <span className="text-2xl font-black text-green-600 dark:text-green-400">
            {statsData?.resolved || 0}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, subscriber name, phone, PPPoE, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open Only</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Outages</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs">Loading support tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center space-y-2 border border-slate-200 dark:border-slate-700">
            <LifeBuoy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No support tickets found</h3>
            <p className="text-xs text-slate-400">No tickets matching the selected filters.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm space-y-4 hover:border-primary/40 transition-colors"
            >
              {/* Top Row: Ticket Info + Customer Info */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 font-mono text-xs font-bold text-primary">
                    {ticket.ticketNo}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    {ticket.subject}
                  </h3>
                  {getPriorityBadge(ticket.priority)}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(ticket.createdAt).toLocaleString('en-GB')}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              {/* Subscriber Details Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Subscriber</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.customer?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone / PPPoE</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{ticket.customer?.phone} ({ticket.customer?.pppoeUsername})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Plan &amp; Speed</span>
                  <span className="font-semibold text-primary">{ticket.customer?.package?.name} ({ticket.customer?.package?.speed})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Area / Optical Rx</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {ticket.customer?.area || 'N/A'} • {ticket.customer?.opticalPower ? `${ticket.customer?.opticalPower} dBm` : 'FTTH'}
                  </span>
                </div>
              </div>

              {/* Customer Complaint Message */}
              <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-900/90 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Customer Complaint / Request:</span>
                <p className="leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
              </div>

              {/* Admin Reply if exists */}
              {ticket.adminReply && (
                <div className="text-xs text-green-900 dark:text-green-300 bg-green-50 dark:bg-green-950/30 p-4 rounded-xl border border-green-200 dark:border-green-800/50 space-y-1">
                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>ISP NOC Response Given:</span>
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{ticket.adminReply}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ticket ${ticket.ticketNo}?`)) {
                      deleteTicketMutation.mutate(ticket.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Delete ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenReplyModal(ticket)}
                  className="px-4 py-2 bg-primary hover:bg-primaryDark text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{ticket.adminReply ? 'Edit Reply & Status' : 'Reply & Resolve Ticket'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Reply & Resolve Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {selectedTicket.ticketNo}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Reply to {selectedTicket.customer?.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Update Status
                  </label>
                  <select
                    value={replyStatus}
                    onChange={(e) => setReplyStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={replyPriority}
                    onChange={(e) => setReplyPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent Outage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Resolution Reply to Subscriber
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Explain the technical action taken (e.g. Optical fiber spliced at DP box, connection restored with -20 dBm signal)..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Quick Reply Templates:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Fiber line checked and optical signal restored.',
                    'Package bandwidth profile updated to requested speed.',
                    'WiFi router settings refreshed & PPPoE session cleared.',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setReplyText(tpl)}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTicketMutation.isPending}
                  className="px-5 py-2 bg-primary hover:bg-primaryDark text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {updateTicketMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Save &amp; Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

