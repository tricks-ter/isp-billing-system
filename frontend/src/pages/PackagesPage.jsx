// frontend/src/pages/PackagesPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../services/packageApi';
import { Plus, Edit, Trash2, Wifi, RefreshCw, Users, Clock, ShieldCheck, Zap } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PackageForm from '../components/PackageForm';
import toast from 'react-hot-toast';

export default function PackagesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const queryClient = useQueryClient();

  // Fetch packages
  const { data: packages, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.getAll().then(res => res.data.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => packageApi.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['packages']);
      toast.success(res.data?.message || 'Package deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete package');
    },
  });

  const handleRefresh = async () => {
    await refetch();
    toast.success('Package list refreshed');
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id, name, customerCount) => {
    if (customerCount > 0) {
      toast.error(`Cannot delete: ${customerCount} customers are currently subscribed to this package`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete package "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-slate-100">Broadband Packages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage internet speed tiers, monthly pricing, and bandwidth profiles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleRefresh} className="cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button onClick={handleAdd} className="cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Add Package</span>
          </Button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-16 text-slate-400">Loading service packages...</div>
        ) : packages?.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Wifi className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Packages Defined</h3>
            <p className="text-xs text-slate-500 mt-1">Create your first broadband plan to assign to subscribers.</p>
          </div>
        ) : (
          packages?.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-primary dark:hover:border-primary hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-primary flex items-center justify-center font-black">
                      <Wifi className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{pkg.name}</h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mt-0.5">
                        {pkg.speed}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 py-4 border-y border-slate-100 dark:border-slate-700/80 my-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Monthly Rate</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900 dark:text-slate-100">৳{pkg.price}</span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Validity:</span>
                    </span>
                    <span className="font-bold">{pkg.validityDays || 30} Days</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Subscribers:</span>
                    </span>
                    <span className="font-black text-primary">{pkg.customerCount || 0} active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Plan</span>
                </button>
                <button
                  onClick={() => handleDelete(pkg.id, pkg.name, pkg.customerCount)}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded-xl transition cursor-pointer"
                  title="Delete Package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Package Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingPackage(null); }}
        title={editingPackage ? 'Edit Broadband Package' : 'Create New Broadband Package'}
      >
        <PackageForm
          packageData={editingPackage}
          onSuccess={() => {
            queryClient.invalidateQueries(['packages']);
            setIsFormOpen(false);
            setEditingPackage(null);
          }}
        />
      </Modal>
    </div>
  );
}