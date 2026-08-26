// frontend/src/pages/BillingPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../services/invoiceApi';
import { paymentApi } from '../services/paymentApi';
import { notificationApi } from '../services/notificationApi';
import { bkashApi } from '../services/bkashApi';
import { FileText, Plus, CreditCard, Eye, Calendar, Download, Send, Link2, ExternalLink } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import GenerateInvoiceForm from '../components/GenerateInvoiceForm';
import PaymentForm from '../components/PaymentForm';
import InvoiceDetailsModal from '../components/InvoiceDetailsModal';
import { exportCSV } from '../utils/export';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to generate'),
  });

  // Send reminders mutation
  const sendRemindersMutation = useMutation({
    mutationFn: () => notificationApi.sendReminders(),
    onSuccess: (res) => {
      const { sent, failed } = res.data.data;
      toast.success(`Reminders sent: ${sent} successful, ${failed} failed`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to send reminders'),
  });

  const getStatusBadge = (status, dueAmount = 0) => {
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
      paidAmount: inv.paidAmount || 0,
      dueAmount: inv.dueAmount || inv.total - (inv.paidAmount || 0),
      status: inv.status,
      dueDate: new Date(inv.dueDate).toLocaleDateString('en-GB'),
    }));
    exportCSV(dataToExport, columns, `invoices_${month}`);
  };

  const handleCopyQuickPayLink = async (invoiceId) => {
    try {
      const res = await bkashApi.generateQuickPayLink(invoiceId);
      const url = res.data?.data?.quickPayUrl;
      if (url) {
        await navigator.clipboard.writeText(url);
        toast.success('Customer Quick-Pay link copied to clipboard!');
      }
    } catch (err) {
      toast.error('Failed to generate quick pay link');
    }
  };

  const handleBkashOnlinePay = async (invoice) => {
    const loadingToast = toast.loading('Initiating bKash payment...');
    try {
      const res = await bkashApi.createPayment({
        invoiceId: invoice.id,
        payerReference: invoice.customer?.phone,
      });
      toast.dismiss(loadingToast);
      if (res.data?.data?.bkashURL) {
        window.location.href = res.data.data.bkashURL;
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || 'Failed to initiate bKash payment');
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total Invoices</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900">{summary.totalInvoices}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total Amount</p>
            <p className="text-xl lg:text-2xl font-bold text-slate-900">৳{summary.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs text-green-600 mb-1">Collected</p>
            <p className="text-xl lg:text-2xl font-bold text-green-700">৳{summary.totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-600 mb-1">Total Due</p>
            <p className="text-xl lg:text-2xl font-bold text-amber-700">৳{summary.totalDue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div className="flex items-end space-x-2 flex-wrap gap-2">
            <Button onClick={() => setIsGenerateOpen(true)} className="whitespace-nowrap">
              <Plus className="w-4 h-4" />
              <span>Generate</span>
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="whitespace-nowrap">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => sendRemindersMutation.mutate()}
              disabled={sendRemindersMutation.isPending}
              className="whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>Send Reminders</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices List (unchanged) */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : data?.invoices?.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No invoices found</td></tr>
            ) : (
              data?.invoices?.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{inv.customer.name}</div>
                    <div className="text-xs text-slate-500">{inv.customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">৳{inv.total}</td>
                  <td className="px-6 py-4 text-sm text-green-600">৳{inv.paidAmount}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(inv.dueDate).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(inv.status, inv.dueAmount)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-1">
                      {/* Copy Customer Quick-Pay Link */}
                      <button
                        onClick={() => handleCopyQuickPayLink(inv.id)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Copy Customer Quick-Pay Link"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewDetails(inv)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {inv.status !== 'PAID' && (
                        <>
                          {/* Online bKash Checkout */}
                          <button
                            onClick={() => handleBkashOnlinePay(inv)}
                            className="p-1.5 text-pink-600 hover:bg-pink-50 rounded-lg font-bold text-xs flex items-center"
                            title="Pay with bKash"
                          >
                            <span className="text-[10px] px-1 py-0.5 bg-pink-100 text-pink-700 rounded font-black mr-0.5">bKash</span>
                          </button>
                          {/* Manual Cash/POS Collect */}
                          <button
                            onClick={() => handlePay(inv)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Collect Manual Cash Payment"
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

      {/* Mobile Cards (unchanged) */}
      <div className="lg:hidden divide-y divide-slate-200">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : data?.invoices?.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No invoices found</p>
          </div>
        ) : (
          data?.invoices?.map((inv) => (
            <div key={inv.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{inv.customer.name}</h3>
                  <p className="text-xs text-slate-500">{inv.customer.phone}</p>
                </div>
                {getStatusBadge(inv.status, inv.dueAmount)}
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-slate-900">৳{inv.total}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="font-semibold text-green-600">৳{inv.paidAmount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due</p>
                  <p className="font-semibold text-red-600">৳{inv.dueAmount}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(inv)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </Button>
                {inv.status !== 'PAID' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handlePay(inv)}
                    className="flex-1"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay</span>
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="text-xs sm:text-sm text-slate-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="Generate Invoices">
        <GenerateInvoiceForm
          onSubmit={(data) => generateMutation.mutate(data)}
          isLoading={generateMutation.isPending}
          onCancel={() => setIsGenerateOpen(false)}
        />
      </Modal>

      {selectedInvoice && (
        <>
          <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title="Collect Payment">
            <PaymentForm
              invoice={selectedInvoice}
              onSuccess={() => {
                setIsPaymentOpen(false);
                queryClient.invalidateQueries(['invoices']);
                queryClient.invalidateQueries(['invoiceSummary']);
              }}
              onCancel={() => setIsPaymentOpen(false)}
            />
          </Modal>

          <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Invoice Details" size="lg">
            <InvoiceDetailsModal invoice={selectedInvoice} />
          </Modal>
        </>
      )}
    </div>
  );
}