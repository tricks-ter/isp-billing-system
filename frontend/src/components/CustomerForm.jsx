import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { packageApi } from '../services/packageApi';
import { routerApi } from '../services/routerApi';
import { oltApi } from '../services/oltApi';
import Button from './Button';
import toast from 'react-hot-toast';
import { Server, Layers, Radio, RefreshCw } from 'lucide-react';

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
  oltId: z.union([z.number(), z.string(), z.null()])
    .transform((val) => (val && String(val).trim() !== '' ? parseInt(String(val), 10) : null)),
  fiberSplitter: z.string().optional(),
  fiberCore: z.string().optional(),
  pppoeUsername: z.string().optional(),
  pppoePassword: z.string().optional(),
});

export default function CustomerForm({ customer, onSuccess, onCancel }) {
  const isEditing = !!customer;
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          ...customer,
          routerId: customer.routerId ? String(customer.routerId) : '',
          oltId: customer.oltId ? String(customer.oltId) : '',
          packageId: String(customer.packageId),
          fiberSplitter: customer.fiberSplitter || '',
          fiberCore: customer.fiberCore || '',
        }
      : {
          name: '',
          phone: '',
          address: '',
          area: '',
          packageId: '0',
          routerId: '',
          oltId: '',
          fiberSplitter: '',
          fiberCore: '',
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

  const { data: oltsData } = useQuery({
    queryKey: ['olts'],
    queryFn: () => oltApi.getAll().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Customer created successfully!');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to create customer'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => customerApi.update(customer.id, data),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Customer updated successfully!');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to update customer'),
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Router Assignment <span className="text-slate-400 text-xs">(MikroTik)</span>
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
                  {router.name} ({router.ipAddress})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            OLT Node <span className="text-slate-400 text-xs">(BDCOM / ECOM)</span>
          </label>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              {...register('oltId')}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">No OLT (Direct Eth / Wireless)</option>
              {oltsData?.map((olt) => (
                <option key={olt.id} value={olt.id}>
                  {olt.name} ({olt.brand} - {olt.ipAddress})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fiber Splitter Box (TJ / DB)</label>
          <input
            {...register('fiberSplitter')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Box-A2 (Pole 14)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fiber Core / Port</label>
          <input
            {...register('fiberCore')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Core 3 / Port 4"
          />
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">PPPoE WiFi Credentials</p>
              <p className="text-xs text-slate-500">For customer home router dial-up</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const phone = watch('phone') || '';
                const cleanPhone = phone.replace(/\D/g, '').slice(-6);
                const suffix = cleanPhone || Math.floor(1000 + Math.random() * 9000);
                const autoUser = `cust_${suffix}`;
                const autoPass = Math.random().toString(36).slice(-8);
                setValue('pppoeUsername', autoUser);
                setValue('pppoePassword', autoPass);
                toast.success('Generated unique PPPoE credentials');
              }}
              className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto-Generate</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PPPoE Username</label>
              <input
                {...register('pppoeUsername')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                placeholder="cust_123456"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PPPoE Password</label>
              <input
                {...register('pppoePassword')}
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
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