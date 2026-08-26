// frontend/src/pages/BillingPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../services/invoiceApi';
import { paymentApi } from '../services/paymentApi';
import { notificationApi } from '../services/notificationApi';
import { bkashApi } from '../services/bkashApi';
import {
  FileText, Plus, CreditCard, Eye, Calendar, Download, Send, Link2,
  ExternalLink, Edit3, Clock, ToggleLeft, ToggleRight, Check
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import GenerateInvoiceForm from '../components/GenerateInvoiceForm';
import PaymentForm from '../components/PaymentForm';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';
import { exportCSV } from '../utils/export';
import { formatMonthName, formatDisplayDate } from '../utils/dateFormatter';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [dateFormatMode, setDateFormatMode] = useState('month'); // 'month' or 'exact'
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [isBatchDueDateOpen, setIsBatchDueDateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');
  const [batchDueDate, setBatchDueDate] = useState('');

  const queryClient = useQueryClient();

  // Fetch invoices
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', { month, statusFilter, page }],
    queryFn: () => invoiceApi.getAll({ month, status: statusFilter, page, limit: 20 }).then(res => res.data.data),
  });

  // Fetch monthly summary
  const { data: summary } = useQuery({
    queryKey: ['invoiceSummary', month],
    queryFn: () => invoiceApi.getMonthlySummary(month).then(res => res.data.data),
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: (data) => invoiceApi.generate(data),
    onSuccess: (res) => {
      const { created, skipped } = res.data.data;
      toast.success(`Generated ${created} invoices, skipped ${skipped}`);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoiceSummary']);
      setIsGenerateOpen(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to generate invoices'),
  });

  // Update single invoice due date
  const updateDueDateMutation = useMutation({
    mutationFn: ({ id, dueDate }) => invoiceApi.updateDueDate(id, dueDate),
    onSuccess: () => {
      toast.success('Invoice due date updated successfully');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoiceSummary']);
      setIsDueDateModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to update due date'),
  });

  // Batch update due dates
  const batchUpdateDueDateMutation = useMutation({
    mutationFn: ({ month, dueDate }) => invoiceApi.batchUpdateDueDate(month, dueDate),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Updated due dates for all unpaid invoices');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['invoiceSummary']);
      setIsBatchDueDateOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Batch due date update failed'),
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: () => notificationApi.sendReminders(),
    onSuccess: (res) => {
      const { sent, failed } = res.data.data;
      toast.success(`Reminders sent: ${sent} successful, ${failed} failed`);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to send reminders'),
  });

  const getStatusBadge = (status) => {
    if (status === 'PAID') return <Badge variant="success">PAID</Badge>;
    if (status === 'PARTIAL') return <Badge variant="warning">PARTIAL</Badge>;
    return <Badge variant="danger">UNPAID</Badge>;
  };

  const handlePay = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentOpen(true);
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handleOpenDueDateModal = (invoice) => {
    setSelectedInvoice(invoice);
    const d = invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '';
    setNewDueDate(d);
    setIsDueDateModalOpen(true);
  };

  const handleCopyQuickPayLink = async (invoiceId) => {
    try {
      const res = await bkashApi.generateQuickPayLink(invoiceId);
      if (res.data?.data?.quickPayUrl) {
        navigator.clipboard.writeText(res.data.data.quickPayUrl);
        toast.success('Public quick-pay link copied to clipboard!');
      }
    } catch (err) {
      toast.error('Failed to generate quick-pay link');
    }
  };

  const handleBkashOnlinePay = async (invoice) => {
    try {
      const res = await bkashApi.createPayment({
        invoiceId: invoice.id,
        customAmount: invoice.dueAmount || invoice.total,
      });
      if (res.data?.data?.bkashURL) {
        window.open(res.data.data.bkashURL, '_blank');
      } else {
        toast.error('Failed to obtain bKash checkout link');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate bKash payment');
    }
  };

  const handleExportCSV = () => {
    if (!data?.invoices || data.invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'month', label: 'Month' },
      { key: 'customerName', label: 'Customer' },
      { key: 'total', label: 'Total (৳)' },
      { key: 'paidAmount', label: 'Paid (৳)' },
      { key: 'dueAmount', label: 'Due (৳)' },
      { key: 'status', label: 'Status' },
      { key: 'dueDate', label: 'Due Date' },
    ];
    const dataToExport = data.invoices.map(inv => ({
      id: inv.id,
      month: inv.month,
      customerName: inv.customer?.name || 'N/A',
      total: inv.total,
      paidAmount: inv.paidAmount,
      dueAmount: inv.dueAmount,
      status: inv.status,
      dueDate: inv.dueDate,
    }));
    exportCSV(dataToExport, columns, `invoices_${month}`);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Billing &amp; Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage subscriber invoices, due dates, grace periods, and collections
          </p>
        </div>

        {/* Date Format Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setDateFormatMode(dateFormatMode === 'month' ? 'exact' : 'month')}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center space-x-2 cursor-pointer shadow-sm"
          >
            {dateFormatMode === 'month' ? (
              <>
                <ToggleLeft className="w-4 h-4 text-primary" />
                <span>Month View (e.g. {formatMonthName(month)})</span>
              </>
            ) : (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-500" />
                <span>Exact Date (DD/MM/YYYY)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Billing Period</p>
            <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-slate-100">
              {formatMonthName(summary.month)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Total Invoiced</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              ৳{summary.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 p-4 shadow-sm">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Collected</p>
            <p className="text-xl lg:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              ৳{summary.totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/30 p-4 shadow-sm">
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Outstanding Due</p>
            <p className="text-xl lg:text-2xl font-bold text-rose-700 dark:text-rose-400">
              ৳{summary.totalDue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Controls & Batch Action Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 lg:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block font-bold">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block font-bold">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div className="flex items-end space-x-2 flex-wrap gap-2 pt-2 sm:pt-0">
            <Button onClick={() => setIsGenerateOpen(true)} className="whitespace-nowrap cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Generate Invoices</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBatchDueDate('');
                setIsBatchDueDateOpen(true);
              }}
              className="whitespace-nowrap cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Extend Month Due Dates</span>
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="whitespace-nowrap cursor-pointer">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => sendRemindersMutation.mutate()}
              disabled={sendRemindersMutation.isPending}
              className="whitespace-nowrap cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send SMS Alerts</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Billing Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date &amp; Grace</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading subscriber invoices...</td></tr>
              ) : data?.invoices?.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No invoices found for this period.</td></tr>
              ) : (
                data?.invoices?.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{inv.customer.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{inv.customer.phone} • PPPoE: {inv.customer.pppoeUsername}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {dateFormatMode === 'month' ? formatMonthName(inv.month) : inv.month}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">৳{inv.total}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">৳{inv.paidAmount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {formatDisplayDate(inv.dueDate, dateFormatMode, true)}
                        </span>
                        <button
                          onClick={() => handleOpenDueDateModal(inv)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-blue-500 transition cursor-pointer"
                          title="Change Due Date / Extend Grace Period"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Copy Customer Quick-Pay Link */}
                        <button
                          onClick={() => handleCopyQuickPayLink(inv.id)}
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                          title="Copy Customer Quick-Pay Link"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(inv)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer"
                          title="View Statement"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {inv.status !== 'PAID' && (
                          <>
                            {/* Online bKash Checkout */}
                            <button
                              onClick={() => handleBkashOnlinePay(inv)}
                              className="px-2 py-1 bg-[#E2136E]/10 hover:bg-[#E2136E]/20 text-[#E2136E] font-black text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
                              title="Pay via bKash Online"
                            >
                              <span>৳ bKash</span>
                            </button>
                            {/* Manual Cash/POS Collect */}
                            <button
                              onClick={() => handlePay(inv)}
                              className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg cursor-pointer"
                              title="Record Cash Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate Invoices */}
      <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="Generate Monthly Invoices">
        <GenerateInvoiceForm
          onSubmit={(formData) => generateMutation.mutate(formData)}
          isLoading={generateMutation.isPending}
          defaultMonth={month}
        />
      </Modal>

      {/* Modal: Record Cash Payment */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Record Manual Payment">
        <PaymentForm
          invoice={selectedInvoice}
          onSuccess={() => {
            queryClient.invalidateQueries(['invoices']);
            queryClient.invalidateQueries(['invoiceSummary']);
            setIsPaymentOpen(false);
          }}
        />
      </Modal>

      {/* Modal: View Details */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Invoice Statement Details">
        <InvoiceDetailsModal invoice={selectedInvoice} />
      </Modal>

      {/* Modal: Single Due Date Edit */}
      {isDueDateModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Update Due Date / Grace Period
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customer: <strong className="text-slate-800 dark:text-slate-200">{selectedInvoice.customer?.name}</strong> • Month: {formatMonthName(selectedInvoice.month)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                Select New Due Date:
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsDueDateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateDueDateMutation.mutate({ id: selectedInvoice.id, dueDate: newDueDate })}
                disabled={!newDueDate || updateDueDateMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {updateDueDateMutation.isPending ? 'Updating...' : 'Save Due Date'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Batch Extend Due Dates */}
      {isBatchDueDateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Batch Extend Due Dates
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Extend the grace period and due date for all unpaid invoices in <strong className="text-primary">{formatMonthName(month)}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                New Due Date for All Unpaid Invoices:
              </label>
              <input
                type="date"
                value={batchDueDate}
                onChange={(e) => setBatchDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setIsBatchDueDateOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => batchUpdateDueDateMutation.mutate({ month, dueDate: batchDueDate })}
                disabled={!batchDueDate || batchUpdateDueDateMutation.isPending}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {batchUpdateDueDateMutation.isPending ? 'Extending...' : 'Extend All Dues'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}