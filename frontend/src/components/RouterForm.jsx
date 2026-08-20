import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { routerApi } from '../services/routerApi';
import Button from './Button';
import toast from 'react-hot-toast';
import { Server, Lock, User, Globe } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  ipAddress: z.string().min(7, 'Valid IP address required'),
  apiPort: z.number().min(1, 'Port is required').max(65535),
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function RouterForm({ router, onSuccess, onCancel }) {
  const isEditing = !!router;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: router || {
      name: '',
      ipAddress: '',
      apiPort: 8728,
      username: '',
      password: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => routerApi.create(data),
    onSuccess: () => {
      toast.success('Router added successfully');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to add router'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => routerApi.update(router.id, data),
    onSuccess: () => {
      toast.success('Router updated successfully');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update router'),
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
        <strong>Note:</strong> Default MikroTik API port is 8728. Ensure API service is enabled on your router.
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Router Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            {...register('name')}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Main Office Router"
          />
        </div>
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      {/* IP Address */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          IP Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            {...register('ipAddress')}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="192.168.88.1"
          />
        </div>
        {errors.ipAddress && <p className="text-xs text-red-500 mt-1">{errors.ipAddress.message}</p>}
      </div>

      {/* API Port */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          API Port <span className="text-red-500">*</span>
        </label>
        <input
          {...register('apiPort', { valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="8728"
        />
        {errors.apiPort && <p className="text-xs text-red-500 mt-1">{errors.apiPort.message}</p>}
      </div>

      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            {...register('username')}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="admin"
          />
        </div>
        {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            {...register('password')}
            type="password"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="••••••••"
          />
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" isLoading={isLoading}>
          {isEditing ? 'Update Router' : 'Add Router'}
        </Button>
      </div>
    </form>
  );
}