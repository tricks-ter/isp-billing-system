// frontend/src/pages/customer/CustomerPackagesPage.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerPortalApi } from '../../services/customerPortalApi';
import useCustomerAuthStore from '../../store/customerAuthStore';
import { Wifi, Check, Zap, ArrowRight, Loader2, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerPackagesPage() {
  const { customer } = useCustomerAuthStore();
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['customerPackages'],
    queryFn: () => customerPortalApi.getPackages().then(res => res.data.data),
  });

  const requestUpgradeMutation = useMutation({
    mutationFn: (pkg) => customerPortalApi.createTicket({
      subject: `Package Upgrade Request to ${pkg.name} (${pkg.speed})`,
      category: 'PACKAGE_CHANGE',
      priority: 'MEDIUM',
      message: `Hello ISP Support Team, I would like to upgrade my current broadband plan to "${pkg.name}" (${pkg.speed} for ৳${pkg.price}/month). Please adjust my bandwidth profile accordingly. Thank you!`,
    }),
    onSuccess: (res) => {
      toast.success('Upgrade request submitted! Our NOC engineer will update your speed profile shortly.');
      queryClient.invalidateQueries(['customerTickets']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit upgrade request');
    },
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Broadband Packages &amp; Speed Tiers
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore high-speed optical fiber plans and request seamless bandwidth upgrades
        </p>
      </div>

      {/* Package Cards Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <span>Loading available packages...</span>
        </div>
      ) : !packages || packages.length === 0 ? (
        <div className="py-12 text-center text-slate-500 italic">No packages listed.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isCurrent = customer?.package?.id === pkg.id || customer?.package?.name === pkg.name;

            return (
              <div
                key={pkg.id}
                className={`rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between transition-all duration-300 relative ${
                  isCurrent
                    ? 'bg-gradient-to-b from-blue-950/90 to-slate-900 border-2 border-blue-500 shadow-blue-500/10'
                    : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-full shadow-md">
                    Your Current Plan
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fiber Plan</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Wifi className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white">{pkg.name}</h3>
                    <div className="mt-2 flex items-baseline space-x-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">৳{pkg.price}</span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Allocated Speed:</span>
                    <span className="text-base font-black text-blue-400">{pkg.speed}</span>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Truly Unlimited 24/7 FTTH Bandwidth</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Bufferless BDIX, YouTube &amp; Facebook CDN</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Low Ping for Online Gaming &amp; Zoom</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>24/7 Optical NOC Support</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  {isCurrent ? (
                    <div className="w-full py-3 text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      Active Subscription
                    </div>
                  ) : (
                    <button
                      onClick={() => requestUpgradeMutation.mutate(pkg)}
                      disabled={requestUpgradeMutation.isPending}
                      className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                    >
                      {requestUpgradeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Request...</span>
                        </>
                      ) : (
                        <>
                          <span>Request Upgrade</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

