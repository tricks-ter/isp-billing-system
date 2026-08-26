// frontend/src/pages/CustomersPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { packageApi } from '../services/packageApi';
import {
  Plus, Search, Edit, Trash2, Pause, Play, Users, RefreshCw,
  Phone, FileText, Calendar, CheckCircle2, AlertCircle, Sparkles,
  Clock, MessageSquare, X, Send, Loader2
} from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import CustomerForm from '../components/CustomerForm';
import OpticalPowerBadge from '../components/OpticalPowerBadge';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'DUE', 'PAID', 'ADVANCE'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  // Note Modal State
  const [noteModalCustomer, setNoteModalCustomer] = useState(null);
  const [collectionNoteText, setCollectionNoteText] = useState('');
  const [promisedDateText, setPromisedDateText] = useState('');

  const queryClient = useQueryClient();

  const { data: collectionSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['collectionSummary'],
    queryFn: () => customerApi.getCollectionSummary().then(res => res.data.data),
    refetchInterval: 10000,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['customers', { page, search }],
    queryFn: () => customerApi.getAll({ page, limit: 50, search }).then(res => res.data.data),
    staleTime: 10000,
  });

  const { data: packagesData } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.getAll().then(res => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customerApi.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['collectionSummary']);
      toast.success(res.data?.message || 'Customer deleted successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to delete customer'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => customerApi.suspend(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['collectionSummary']);
      toast.success(res.data?.message || 'Customer suspended successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to suspend customer'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => customerApi.restore(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['collectionSummary']);
      toast.success(res.data?.message || 'Customer restored successfully');
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to restore customer'),
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note, promisedPayDate }) => customerApi.updateCollectionNote(id, { collectionNote: note, promisedPayDate }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      queryClient.invalidateQueries(['collectionSummary']);
      toast.success(res.data?.message || 'Collection note saved');
      setNoteModalCustomer(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to save note'),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete customer "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenNoteModal = (customer) => {
    setNoteModalCustomer(customer);
    setCollectionNoteText(customer.collectionNote || '');
    setPromisedDateText(customer.promisedPayDate ? new Date(customer.promisedPayDate).toISOString().slice(0, 10) : '');
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteModalCustomer) return;
    noteMutation.mutate({
      id: noteModalCustomer.id,
      note: collectionNoteText.trim(),
      promisedPayDate: promisedDateText || null,
    });
  };

  const getStatusBadge = (status) => {
    const variants = { ACTIVE: 'success', SUSPENDED: 'danger', EXPIRED: 'warning' };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // Filter customers by selected tab
  let filteredCustomers = data?.customers || [];
  if (activeTab === 'DUE') {
    const dueIds = new Set((collectionSummary?.lists?.due || []).map(c => c.id));
    filteredCustomers = filteredCustomers.filter(c => dueIds.has(c.id));
  } else if (activeTab === 'PAID') {
    const paidIds = new Set((collectionSummary?.lists?.paid || []).map(c => c.id));
    filteredCustomers = filteredCustomers.filter(c => paidIds.has(c.id));
  } else if (activeTab === 'ADVANCE') {
    const advIds = new Set((collectionSummary?.lists?.advance || []).map(c => c.id));
    filteredCustomers = filteredCustomers.filter(c => advIds.has(c.id));
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Customer Management &amp; Due Desk</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage subscriber profiles, dial phones directly, track payment promises, and settle dues
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await Promise.all([refetch(), refetchSummary()]);
              toast.success('Customer directory refreshed');
            }}
            className="cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }} className="cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Subscribers ({collectionSummary?.totalCustomers || data?.pagination?.total || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('DUE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'DUE'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Due Customers ({collectionSummary?.dueCount || 0})</span>
          {collectionSummary?.totalOutstandingDue > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-rose-700 text-white rounded">
              ৳{collectionSummary.totalOutstandingDue}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('PAID')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'PAID'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Paid This Month ({collectionSummary?.paidCount || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('ADVANCE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ADVANCE'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Advance Paid ({collectionSummary?.advanceCount || 0})</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 lg:p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriber name, phone, PPPoE, area..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm lg:text-base text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Subscriber</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Phone (Click to Dial)</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Package &amp; Bill</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Hardware (Router/OLT)</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">PPPoE</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Collection Note / Promise</th>
                <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    No subscribers found matching the "{activeTab}" filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{customer.name}</div>
                      <div className="text-xs text-slate-400">{customer.area || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-mono font-bold border border-blue-200 dark:border-blue-800 transition-colors"
                        title="Click to redirect to phone dial pad"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-500" />
                        <span>{customer.phone}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{customer.package?.name}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">৳{customer.package?.price}/mo</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {customer.router ? (
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{customer.router.name}</div>
                      ) : (
                        <span className="text-slate-400">No router</span>
                      )}
                      {customer.olt && (
                        <div className="mt-1">
                          <OpticalPowerBadge power={customer.opticalPower || customer.onu?.rxPower} status={customer.onu?.status} size="sm" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold">
                      {customer.pppoeUsername}
                    </td>
                    <td className="px-6 py-4">
                      {customer.collectionNote ? (
                        <div
                          onClick={() => handleOpenNoteModal(customer)}
                          className="cursor-pointer group bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2 rounded-xl text-xs max-w-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>Note Logged</span>
                            </span>
                            {customer.promisedPayDate && (
                              <span>Due by: {new Date(customer.promisedPayDate).toLocaleDateString('en-GB')}</span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 truncate font-sans text-xs group-hover:text-primary">
                            {customer.collectionNote}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenNoteModal(customer)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>+ Add Note</span>
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(customer.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleOpenNoteModal(customer)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                          title="Add / Edit Call & Payment Note"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {customer.status === 'ACTIVE' ? (
                          <button
                            onClick={() => suspendMutation.mutate(customer.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                            title="Suspend Customer"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreMutation.mutate(customer.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                            title="Restore Customer"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">Loading...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500">No subscribers found</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">{customer.name}</h3>
                    {getStatusBadge(customer.status)}
                  </div>
                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-mono font-bold mt-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{customer.phone}</span>
                  </a>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500">{customer.package?.name}</span>
                  <p className="text-sm font-black text-emerald-600">৳{customer.package?.price}/mo</p>
                </div>
              </div>

              {customer.collectionNote && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-400 text-[10px]">
                    <span>NOTE:</span>
                    {customer.promisedPayDate && <span>Due: {new Date(customer.promisedPayDate).toLocaleDateString('en-GB')}</span>}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200">{customer.collectionNote}</p>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenNoteModal(customer)}
                  className="flex-1 text-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Note</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}
                  className="flex-1 text-xs text-blue-600"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Customer Edit / Add Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingCustomer(null); }}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
            queryClient.invalidateQueries(['customers']);
            queryClient.invalidateQueries(['collectionSummary']);
          }}
          onCancel={() => { setIsFormOpen(false); setEditingCustomer(null); }}
        />
      </Modal>

      {/* Modal: Collection Note & Promise */}
      {noteModalCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Payment Promise &amp; Collection Note
                </h3>
                <p className="text-xs text-slate-500">For {noteModalCustomer.name} ({noteModalCustomer.pppoeUsername})</p>
              </div>
              <button
                onClick={() => setNoteModalCustomer(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Dial Customer Phone</span>
                <a
                  href={`tel:${noteModalCustomer.phone}`}
                  className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 mt-0.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{noteModalCustomer.phone}</span>
                </a>
              </div>
              <a
                href={`tel:${noteModalCustomer.phone}`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow flex items-center space-x-1"
              >
                <Phone className="w-3 h-3" />
                <span>Call Now</span>
              </a>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Promised Payment Date
                </label>
                <input
                  type="date"
                  value={promisedDateText}
                  onChange={(e) => setPromisedDateText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Payment Discussion Note
                </label>
                <textarea
                  rows={3}
                  value={collectionNoteText}
                  onChange={(e) => setCollectionNoteText(e.target.value)}
                  placeholder="e.g. Customer promised to pay via bKash on Friday. Grace period granted..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Quick Notes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Will pay full bill via bKash today.',
                    'Out of town - grace period granted till weekend.',
                    'Called - phone was busy, will retry in evening.',
                    'Requested bill discount due to optical line maintenance.',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setCollectionNoteText(tpl)}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px] hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setNoteModalCustomer(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={noteMutation.isPending}
                  className="px-5 py-2 bg-primary hover:bg-primaryDark text-white text-xs font-bold rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  {noteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}