// frontend/src/pages/customer/CustomerProfilePage.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../../services/customerPortalApi';
import useCustomerAuthStore from '../../store/customerAuthStore';
import {
  User, Phone, MapPin, Calendar, ShieldCheck, Wifi,
  HelpCircle, Radio, CheckCircle2, Save, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
});

export default function CustomerProfilePage() {
  const { customer, login } = useCustomerAuthStore();
  const token = useCustomerAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: customer?.phone || '',
      address: customer?.address || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => customerPortalApi.updateProfile(data),
    onSuccess: (res) => {
      toast.success('Contact information updated successfully!');
      login({ ...customer, ...res.data.data }, token);
      queryClient.invalidateQueries(['customerDashboard']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Subscriber Profile &amp; WiFi Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your account contact details and learn how to optimize your home WiFi router
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column: Account Details & Update */}
        <div className="lg:col-span-1 space-y-6">
          {/* Identity Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-xl">
                {customer?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{customer?.name}</h3>
                <p className="text-xs text-blue-400 font-mono">@{customer?.pppoeUsername}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                  {customer?.status || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Broadband Package:</span>
                <span className="font-semibold text-slate-200">{customer?.package?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Service Area:</span>
                <span className="text-slate-200">{customer?.area || 'Dhaka'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Activation Date:</span>
                <span className="text-slate-200">
                  {customer?.joinDate ? new Date(customer.joinDate).toLocaleDateString('en-GB') : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Contact Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white">Update Contact Information</h4>
            <form onSubmit={handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Primary Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...register('phone')}
                    type="text"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-red-400 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Installation Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <textarea
                    {...register('address')}
                    rows={2}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Contact Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Home Router & WiFi Troubleshooting Guide */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Home WiFi &amp; Router Guide</h3>
                <p className="text-xs text-slate-400">Quick steps to solve common WiFi speed &amp; latency issues</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                  <Radio className="w-4 h-4" />
                  <span>1. Checking Optical ONU Lights</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Look at your fiber ONU box (the small device the black fiber wire connects to):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-emerald-400">PON (Green Steady):</strong> Fiber cable and signal are perfect.</li>
                  <li><strong className="text-rose-400">LOS (Red Blinking):</strong> Fiber line is bent, unplugged, or disconnected in your area. Open a support ticket immediately.</li>
                  <li><strong className="text-amber-400">LAN (Green Blinking):</strong> Data is flowing between your ONU and WiFi router.</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>2. 2.4GHz vs 5GHz Dual-Band WiFi</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  If your WiFi router supports Dual-Band (e.g. TP-Link, Mercusys, Netis):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Always connect your TV, Laptop, and Smartphones to the <strong className="text-white">5GHz network</strong> for full speed without interference.</li>
                  <li>Use the 2.4GHz network only when you are far away behind multiple concrete walls.</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>3. Router Reboot / Power Cycle</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Routers accumulate cached packets and heat. Restarting your WiFi router once every 7 days clears RAM and refreshes your PPPoE session routing path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

