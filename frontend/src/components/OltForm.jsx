// frontend/src/components/OltForm.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { oltApi } from '../services/oltApi';
import Button from './Button';
import toast from 'react-hot-toast';
import { Server, Zap, Shield, Radio } from 'lucide-react';

const oltSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  brand: z.enum(['BDCOM', 'ECOM', 'VSOL', 'HUAWEI', 'GENERIC']),
  ponType: z.enum(['EPON', 'GPON']),
  ipAddress: z.string().min(7, 'Invalid IP address'),
  snmpCommunity: z.string().default('public'),
  snmpPort: z.coerce.number().default(161),
  cliProtocol: z.enum(['TELNET', 'SSH']).default('TELNET'),
  cliPort: z.coerce.number().default(23),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  enablePassword: z.string().optional(),
  ponPortCount: z.coerce.number().min(1).max(32).default(4),
  uplinkPortCount: z.coerce.number().min(1).max(8).default(2),
  location: z.string().optional(),
  isMock: z.boolean().default(true),
});

export default function OltForm({ olt, onSuccess, onCancel }) {
  const isEditing = !!olt;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(oltSchema),
    defaultValues: olt
      ? {
          ...olt,
          snmpPort: olt.snmpPort || 161,
          cliPort: olt.cliPort || 23,
          isMock: olt.isMock ?? true,
        }
      : {
          name: '',
          brand: 'BDCOM',
          ponType: 'EPON',
          ipAddress: '192.168.10.20',
          snmpCommunity: 'public',
          snmpPort: 161,
          cliProtocol: 'TELNET',
          cliPort: 23,
          username: 'admin',
          password: '',
          enablePassword: '',
          ponPortCount: 4,
          uplinkPortCount: 2,
          location: '',
          isMock: true,
        },
  });

  const selectedBrand = watch('brand');

  const createMutation = useMutation({
    mutationFn: (data) => oltApi.create(data),
    onSuccess: () => {
      toast.success('OLT device created successfully');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create OLT'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => oltApi.update(olt.id, data),
    onSuccess: () => {
      toast.success('OLT device updated successfully');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update OLT'),
  });

  const onSubmit = (data) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const applyPreset = (brand, ponType, ports) => {
    setValue('brand', brand);
    setValue('ponType', ponType);
    setValue('ponPortCount', ports);
    if (brand === 'BDCOM') {
      setValue('name', `BDCOM ${ponType === 'GPON' ? 'GP3600' : 'P3310'}-${ports}P`);
      setValue('cliProtocol', 'TELNET');
      setValue('cliPort', 23);
    } else if (brand === 'ECOM') {
      setValue('name', `ECOM ${ponType}-${ports}P`);
      setValue('cliProtocol', 'TELNET');
      setValue('cliPort', 23);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Brand Presets */}
      {!isEditing && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Quick Vendor Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('BDCOM', 'EPON', 4)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
            >
              BDCOM P3310 (4-Port EPON)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('BDCOM', 'GPON', 8)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
            >
              BDCOM GP3600 (8-Port GPON)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ECOM', 'EPON', 4)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
            >
              ECOM EPON (4-Port)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('ECOM', 'EPON', 8)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors"
            >
              ECOM EPON (8-Port)
            </button>
          </div>
        </div>
      )}

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            OLT Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            placeholder="e.g. BDCOM Core OLT - Main POP"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 text-sm"
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            IP Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('ipAddress')}
            placeholder="e.g. 192.168.10.20"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 text-sm font-mono"
          />
          {errors.ipAddress && <p className="text-xs text-red-500 mt-1">{errors.ipAddress.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Brand / Manufacturer
          </label>
          <select
            {...register('brand')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="BDCOM">BDCOM</option>
            <option value="ECOM">ECOM</option>
            <option value="VSOL">VSOL</option>
            <option value="HUAWEI">Huawei</option>
            <option value="GENERIC">Generic EPON/GPON</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            PON Technology
          </label>
          <select
            {...register('ponType')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="EPON">EPON (1.25 Gbps - MAC registration)</option>
            <option value="GPON">GPON (2.5 Gbps - Serial No registration)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            PON Port Count
          </label>
          <select
            {...register('ponPortCount')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="4">4 Ports</option>
            <option value="8">8 Ports</option>
            <option value="16">16 Ports</option>
            <option value="2">2 Ports</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Location / POP
          </label>
          <input
            type="text"
            {...register('location')}
            placeholder="e.g. Main POP Server Rack 2"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
      </div>

      {/* CLI & Telnet/SSH Credentials */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          CLI Access (Telnet / SSH)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Protocol & Port</label>
            <div className="flex gap-2">
              <select
                {...register('cliProtocol')}
                className="w-2/3 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="TELNET">Telnet</option>
                <option value="SSH">SSH</option>
              </select>
              <input
                type="number"
                {...register('cliPort')}
                className="w-1/3 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Username *</label>
            <input
              type="text"
              {...register('username')}
              placeholder="admin"
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Password *</label>
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          {selectedBrand === 'BDCOM' && (
            <div className="md:col-span-3">
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                Enable / Privileged Mode Password (BDCOM)
              </label>
              <input
                type="password"
                {...register('enablePassword')}
                placeholder="Optional enable password for privileged CLI commands"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* SNMP Settings */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          SNMP Telemetry Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">SNMP Community</label>
            <input
              type="text"
              {...register('snmpCommunity')}
              placeholder="public"
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">SNMP Port</label>
            <input
              type="number"
              {...register('snmpPort')}
              placeholder="161"
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Mock Mode */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <label className="flex items-start space-x-3 cursor-pointer p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg">
          <input
            type="checkbox"
            {...register('isMock')}
            className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
          />
          <div>
            <span className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Enable Mock Mode (Simulation)
            </span>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Simulate PON ports, live optical power, and ONU discovery without connecting to physical hardware.
            </p>
          </div>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEditing ? 'Update OLT' : 'Add OLT'}
        </Button>
      </div>
    </form>
  );
}

