import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { packageApi } from '../services/packageApi';
import { Plus, Search, Edit, Trash2, Pause, Play, Users, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import CustomerForm from '../components/CustomerForm';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', { page, search }],
    queryFn: () => customerApi.getAll({ page, limit: 20, search }).then(res => res.data.data),
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: packagesData } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.getAll().then(res => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => customerApi.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer suspended');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to suspend'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => customerApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer restored');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to restore'),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete customer "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { ACTIVE: 'success', SUSPENDED: 'danger', EXPIRED: 'warning' };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.pagination?.total || 0} total customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
          <Button onClick={() => { setEditingCustomer(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 lg:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, PPPoE..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm lg:text-base"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Router</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">PPPoE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
              ) : data?.customers?.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No customers found</td></tr>
              ) : (
                data?.customers?.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                      <div className="text-xs text-slate-500">{customer.area || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{customer.phone}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{customer.package?.name}</div>
                      <div className="text-xs text-slate-500">৳{customer.package?.price}/mo</div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.router ? (
                        <div className="text-sm text-slate-900">{customer.router.name}</div>
                      ) : (
                        <span className="text-xs text-slate-400">No router</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{customer.pppoeUsername}</td>
                    <td className="px-6 py-4">{getStatusBadge(customer.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-1">
                        {customer.status === 'ACTIVE' ? (
                          <button
                            onClick={() => suspendMutation.mutate(customer.id)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Suspend"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreMutation.mutate(customer.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Restore"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
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
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">Loading...</div>
        ) : data?.customers?.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No customers found</p>
          </div>
        ) : (
          data?.customers?.map((customer) => (
            <div key={customer.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{customer.name}</h3>
                    {getStatusBadge(customer.status)}
                  </div>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-xs text-slate-500">Package</p>
                  <p className="font-medium text-slate-900">{customer.package?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="font-medium text-slate-900">৳{customer.package?.price}/mo</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Router</p>
                  <p className="font-medium text-slate-900">{customer.router?.name || 'None'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">PPPoE</p>
                  <p className="font-mono text-slate-700 text-xs">{customer.pppoeUsername}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                {customer.status === 'ACTIVE' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => suspendMutation.mutate(customer.id)}
                    className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Suspend</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreMutation.mutate(customer.id)}
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Restore</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(customer.id, customer.name)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
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
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page === data.pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        size="lg"
      >
        <CustomerForm
          customer={editingCustomer}
          packages={packagesData || []}
          onSuccess={() => {
            setIsFormOpen(false);
            queryClient.invalidateQueries(['customers']);
            toast.success('Customer created successfully!');
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}