import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { packageApi } from '../services/packageApi';
import { routerApi } from '../services/routerApi';
import Button from './Button';
import toast from 'react-hot-toast';
import { Server } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().optional(),
  area: z.string().optional(),
  packageId: z.union([z.number(), z.string()])
    .transform((val) => parseInt(String(val), 10))
    .refine((val) => val >= 1, 'Please select a package'),
  routerId: z.union([z.number(), z.string(), z.null()])
    .transform((val) => (val && String(val).trim() !== '' ? parseInt(String(val), 10) : null)),
  pppoeUsername: z.string().optional(),
  pppoePassword: z.string().optional(),
});

export default function CustomerForm({ customer, onSuccess, onCancel }) {
  const isEditing = !!customer;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          ...customer,
          routerId: customer.routerId ? String(customer.routerId) : '',
          packageId: String(customer.packageId),
        }
      : {
          name: '',
          phone: '',
          address: '',
          area: '',
          packageId: '0',
          routerId: '',
          pppoeUsername: '',
          pppoePassword: '',
        },
  });

  const { data: packagesData } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.getAll().then(res => res.data.data),
  });

  const { data: routersData } = useQuery({
    queryKey: ['routers'],
    queryFn: () => routerApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: () => {
      toast.success('Customer created successfully! Router sync initiated in background.');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => customerApi.update(customer.id, data),
    onSuccess: () => {
      toast.success('Customer updated successfully! Router sync initiated in background.');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update customer'),
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <strong>Note:</strong> Router operations (PPPoE creation) are processed in the background. 
        The customer will be created immediately in the database.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="John Doe"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            {...register('phone')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="01XXXXXXXXX"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Area</label>
          <input
            {...register('area')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Dhanmondi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Package <span className="text-red-500">*</span>
          </label>
          <select
            {...register('packageId')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="0">Select a package</option>
            {packagesData?.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} - {pkg.speed} - ৳{pkg.price}/mo
              </option>
            ))}
          </select>
          {errors.packageId && <p className="text-xs text-red-500 mt-1">{errors.packageId.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Router Assignment <span className="text-slate-400 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              {...register('routerId')}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">No Router (Manual Management)</option>
              {routersData?.map((router) => (
                <option key={router.id} value={router.id}>
                  {router.name} ({router.ipAddress}:{router.apiPort})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assigning a router enables automatic PPPoE, suspend/restore, and live status
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
        <textarea
          {...register('address')}
          rows="2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="House 123, Road 4, Block A"
        />
      </div>

      {!isEditing && (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600 mb-3">
            PPPoE Credentials (leave blank to auto-generate)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PPPoE Username</label>
              <input
                {...register('pppoeUsername')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="customer_pppoe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PPPoE Password</label>
              <input
                {...register('pppoePassword')}
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="password123"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
}