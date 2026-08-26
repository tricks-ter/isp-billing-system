// frontend/src/components/OnuAuthorizeModal.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../services/customerApi';
import { oltApi } from '../services/oltApi';
import Button from './Button';
import toast from 'react-hot-toast';
import { CheckCircle2, User, Search } from 'lucide-react';

export default function OnuAuthorizeModal({ oltId, initialData = {}, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      portNumber: initialData.portNumber || 1,
      onuId: initialData.onuId || '',
      macAddress: initialData.macAddress || '',
      serialNumber: initialData.serialNumber || '',
      name: initialData.name || '',
      model: initialData.model || 'XPON ONU',
      vlanId: 100,
      vlanMode: 'TAG',
    },
  });

  // Query customers to bind
  const { data: customerData } = useQuery({
    queryKey: ['customersSearch', customerSearch],
    queryFn: () => customerApi.getAll({ page: 1, limit: 10, search: customerSearch }).then(res => res.data.data),
    enabled: customerSearch.length > 1,
  });

  const authorizeMutation = useMutation({
    mutationFn: (data) => oltApi.authorizeOnu(oltId, {
      ...data,
      customerId: selectedCustomer ? selectedCustomer.id : null,
    }),
    onSuccess: (res) => {
      toast.success(res.data.data?.message || 'ONU authorized and provisioned successfully!');
      queryClient.invalidateQueries(['olt', oltId]);
      queryClient.invalidateQueries(['registeredOnus', oltId]);
      queryClient.invalidateQueries(['unregisteredOnus', oltId]);
      queryClient.invalidateQueries(['customers']);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to authorize ONU'),
  });

  const onSubmit = (data) => {
    authorizeMutation.mutate(data);
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setValue('name', cust.name);
    setCustomerSearch('');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300">
        <strong>1-Click Provisioning:</strong> This will register the ONU onto the OLT, bind the VLAN profile, and link it with the customer billing account.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            PON Port Number *
          </label>
          <input
            type="number"
            {...register('portNumber', { required: true })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            ONU Slot ID (1..64)
          </label>
          <input
            type="number"
            {...register('onuId')}
            placeholder="Auto-assign if blank"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            MAC Address (EPON)
          </label>
          <input
            type="text"
            {...register('macAddress')}
            placeholder="e.g. E0:67:B3:AA:BB:CC"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Serial Number (GPON)
          </label>
          <input
            type="text"
            {...register('serialNumber')}
            placeholder="e.g. BDCM12345678"
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            VLAN ID
          </label>
          <input
            type="number"
            {...register('vlanId')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            VLAN Mode
          </label>
          <select
            {...register('vlanMode')}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="TAG">TAG (Standard 802.1Q)</option>
            <option value="TRANSLATE">Translate</option>
            <option value="TRANSPARENT">Transparent</option>
          </select>
        </div>
      </div>

      {/* Customer Linkage */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" />
          Assign to Customer (Optional)
        </label>

        {selectedCustomer ? (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedCustomer.name}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Phone: {selectedCustomer.phone} | PPPoE: {selectedCustomer.pppoeUsername}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer name, phone, or PPPoE user..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            {customerData?.customers && customerData.customers.length > 0 && (
              <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {customerData.customers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">({c.phone})</span>
                    </div>
                    <span className="font-mono text-slate-400">{c.pppoeUsername}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button type="button" variant="outline" onClick={onClose} disabled={authorizeMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={authorizeMutation.isPending}>
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {authorizeMutation.isPending ? 'Provisioning...' : 'Authorize & Provision ONU'}
        </Button>
      </div>
    </form>
  );
}

