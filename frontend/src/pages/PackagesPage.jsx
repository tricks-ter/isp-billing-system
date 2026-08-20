import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { packageApi } from '../services/packageApi';
import { Plus, Edit, Trash2, Wifi } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import PackageForm from '../components/PackageForm';
import toast from 'react-hot-toast';

export default function PackagesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const queryClient = useQueryClient();

  // Fetch packages
  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.getAll().then(res => res.data.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => packageApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['packages']);
      toast.success('Package deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    },
  });

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
      toast.error(`Cannot delete: ${customerCount} customers are using this package`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete package "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Packages</h1>
          <p className="text-sm text-slate-500 mt-1">Manage internet service plans</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          <span>Add Package</span>
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Loading...</div>
        ) : packages?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No packages found. Create your first package!
          </div>
        ) : (
          packages?.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                    <p className="text-sm text-slate-500">{pkg.speed}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Price</span>
                  <span className="text-2xl font-bold text-slate-900">৳{pkg.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Validity</span>
                  <span className="text-sm font-medium text-slate-700">{pkg.validity} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Customers</span>
                  <span className="text-sm font-medium text-slate-700">{pkg._count?.customers || 0}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(pkg)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pkg.id, pkg.name, pkg._count?.customers || 0)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingPackage ? 'Edit Package' : 'Add New Package'}
      >
        <PackageForm
          package={editingPackage}
          onSuccess={() => {
            setIsFormOpen(false);
            queryClient.invalidateQueries(['packages']);
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>
    </div>
  );
}