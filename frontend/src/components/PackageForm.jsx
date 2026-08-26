import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { packageApi } from '../services/packageApi';
import Button from './Button';
import toast from 'react-hot-toast';

const packageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  speed: z.string().min(2, 'Speed must be specified'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  validity: z.coerce.number().min(1, 'Validity must be at least 1 day'),
});

export default function PackageForm({ package: pkg, onSuccess, onCancel }) {
  const isEditing = !!pkg;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(packageSchema),
    defaultValues: pkg || {
      name: '',
      speed: '',
      price: 1000,
      validity: 30,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => packageApi.create(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Package created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to create package');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => packageApi.update(pkg.id, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Package updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update package');
    },
  });

  const onSubmit = (data) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Package Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Home Standard"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {/* Speed */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Speed <span className="text-red-500">*</span>
        </label>
        <input
          {...register('speed')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="20 Mbps"
        />
        {errors.speed && <p className="text-xs text-red-500 mt-1">{errors.speed.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Price (৳) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('price')}
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="1000"
          />
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
        </div>

        {/* Validity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Validity (days) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('validity')}
            type="number"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="30"
          />
          {errors.validity && <p className="text-xs text-red-500 mt-1">{errors.validity.message}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Update Package' : 'Create Package'}
        </Button>
      </div>
    </form>
  );
}