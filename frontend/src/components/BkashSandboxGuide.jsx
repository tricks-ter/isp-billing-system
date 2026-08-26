// frontend/src/components/BkashSandboxGuide.jsx
import { useState } from 'react';
import { Smartphone, KeyRound, Lock, Copy, Check, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BkashSandboxGuide({ compact = false }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-pink-950/40 via-slate-900/80 to-pink-950/40 border border-pink-500/30 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-pink-500/20">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#E2136E]/20 text-[#E2136E] flex items-center justify-center font-black text-xs">
            ৳
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center space-x-1.5">
              <span>bKash Live Sandbox Test Credentials</span>
              <span className="px-2 py-0.5 text-[9px] bg-pink-500/20 text-pink-300 font-mono rounded-full font-bold">
                TEST MODE
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Use these simulation credentials to test instant invoice recharge</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
        {/* Wallet Number */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <Smartphone className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Wallet Number</span>
              <span className="text-xs font-mono font-bold text-white tracking-wider truncate block">01770618575</span>
            </div>
          </div>
          <button
            onClick={() => handleCopy('01770618575', 'Wallet Number')}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-pink-400 transition cursor-pointer flex-shrink-0"
            title="Copy Number"
          >
            {copiedKey === 'Wallet Number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Test OTP */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Verification OTP</span>
              <span className="text-xs font-mono font-bold text-white tracking-wider block">123456</span>
            </div>
          </div>
          <button
            onClick={() => handleCopy('123456', 'OTP')}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition cursor-pointer flex-shrink-0"
            title="Copy OTP"
          >
            {copiedKey === 'OTP' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Test PIN */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Test PIN</span>
              <span className="text-xs font-mono font-bold text-white tracking-wider block">12121</span>
            </div>
          </div>
          <button
            onClick={() => handleCopy('12121', 'PIN')}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition cursor-pointer flex-shrink-0"
            title="Copy PIN"
          >
            {copiedKey === 'PIN' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

