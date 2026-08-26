// frontend/src/pages/customer/CustomerTicketsPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerPortalApi } from '../../services/customerPortalApi';
import {
  LifeBuoy, Plus, CheckCircle2, Clock, AlertTriangle,
  MessageSquare, Loader2, X, Send, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const ticketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  category: z.enum([
    'NO_INTERNET',
    'SLOW_SPEED',
    'OPTICAL_LOS',
    'BILLING',
    'PACKAGE_CHANGE',
    'ROUTER_CONFIG',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  message: z.string().min(10, 'Please provide a detailed description (at least 10 characters)'),
});

export default function CustomerTicketsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['customerTickets'],
    queryFn: () => customerPortalApi.getTickets().then(res => res.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: '',
      category: 'NO_INTERNET',
      priority: 'MEDIUM',
      message: '',
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => customerPortalApi.createTicket(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Support ticket submitted successfully!');
      queryClient.invalidateQueries(['customerTickets']);
      queryClient.invalidateQueries(['customerDashboard']);
      reset();
      setModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit ticket');
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">In Progress</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Open</span>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Support Desk &amp; Complaints
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Submit service complaints or inquiries directly to our network engineering team
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
            <span>Loading support tickets...</span>
          </div>
        ) : !tickets || tickets.length === 0 ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No active support tickets</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Need technical assistance, fiber line check, or speed upgrade? Create a new support ticket above.
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                    {ticket.ticketNo}
                  </span>
                  <h3 className="font-bold text-white text-base">{ticket.subject}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(ticket.createdAt).toLocaleString('en-GB')}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60">
                <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Your Issue Description:</p>
                <p className="leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
              </div>

              {ticket.adminReply && (
                <div className="text-xs text-emerald-300 bg-emerald-950/30 p-4 rounded-2xl border border-emerald-800/40 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[10px] uppercase">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ISP Engineering Team Response:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{ticket.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Support Ticket */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Create Support Ticket</h3>
                <p className="text-xs text-slate-400">Describe the problem for our support team</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit((data) => createTicketMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Issue Subject</label>
                <input
                  {...register('subject')}
                  type="text"
                  placeholder="e.g. Red LOS optical light flashing on ONU"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                {errors.subject && <p className="text-[11px] text-red-400 mt-1">{errors.subject.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="NO_INTERNET">No Internet Connection</option>
                    <option value="SLOW_SPEED">Slow Speed / High Latency</option>
                    <option value="OPTICAL_LOS">Red Light / Fiber Cut (LOS)</option>
                    <option value="ROUTER_CONFIG">WiFi &amp; Router Settings</option>
                    <option value="BILLING">Billing &amp; Payment Query</option>
                    <option value="PACKAGE_CHANGE">Package Upgrade Request</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium (Standard)</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="URGENT">Urgent (Total Outage)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Detailed Explanation</label>
                <textarea
                  {...register('message')}
                  rows={4}
                  placeholder="Please describe when the problem started and any symptoms (e.g. ONU lights, router rebooted)..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
                {errors.message && <p className="text-[11px] text-red-400 mt-1">{errors.message.message}</p>}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Ticket</span>
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

