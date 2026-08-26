// frontend/src/pages/MockBkashPage.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MockBkashPage() {
  const [searchParams] = useSearchParams();
  const paymentID = searchParams.get('paymentID') || 'BK_MOCK_101';
  const amount = searchParams.get('amount') || '500.00';
  const invoiceNumber = searchParams.get('invoiceNumber') || 'INV-1001';

  const [step, setStep] = useState(1); // 1: Wallet Number, 2: OTP, 3: PIN
  const [walletNumber, setWalletNumber] = useState('01823074817');
  const [otp, setOtp] = useState('123456');
  const [pin, setPin] = useState('12121');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleCancel = () => {
    window.location.href = `${apiUrl}/bkash/callback?paymentID=${paymentID}&status=cancel`;
  };

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Redirect to backend callback handler with success
    setTimeout(() => {
      window.location.href = `${apiUrl}/bkash/callback?paymentID=${paymentID}&status=success`;
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center p-4 font-sans antialiased text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* bKash Pink Header */}
        <div className="bg-[#E2136E] text-white p-6 text-center relative">
          <div className="inline-block bg-white text-[#E2136E] font-black text-xl px-4 py-1 rounded-lg shadow-md mb-2">
            bKash
          </div>
          <p className="text-xs font-semibold text-pink-100 uppercase tracking-wider">Payment Gateway (Simulator)</p>
          <div className="mt-3 pt-3 border-t border-pink-400/50 flex justify-between items-center text-xs">
            <span>Merchant: <strong className="text-white">ISP Broadband Service</strong></span>
            <span>Invoice: <strong className="text-white">{invoiceNumber}</strong></span>
          </div>
        </div>

        {/* Amount Display */}
        <div className="bg-pink-50/70 p-4 border-b border-pink-100 text-center">
          <span className="text-xs text-slate-500 block mb-0.5 font-medium">Total Amount to Pay</span>
          <span className="text-3xl font-black text-[#E2136E]">৳{parseFloat(amount).toLocaleString()}</span>
        </div>

        {/* Step Form */}
        <div className="p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Your bKash Account Number
                </label>
                <input
                  type="text"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="e.g. 018XXXXXXXX"
                  className="w-full px-4 py-3 border-2 border-pink-200 focus:border-[#E2136E] rounded-xl outline-none font-mono text-base font-semibold"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  (Test wallet provided for sandbox demonstration)
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-[#E2136E] hover:bg-[#c70f5e] text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter Verification Code (OTP)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  className="w-full px-4 py-3 border-2 border-pink-200 focus:border-[#E2136E] rounded-xl outline-none font-mono text-center text-xl font-bold tracking-widest"
                />
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  OTP sent to {walletNumber} (Default: 123456)
                </p>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-3.5 bg-[#E2136E] hover:bg-[#c70f5e] text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Verify OTP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Enter bKash PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter 5-digit PIN"
                    className="w-full px-4 py-3 border-2 border-pink-200 focus:border-[#E2136E] rounded-xl outline-none font-mono text-center text-xl font-bold tracking-widest"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 text-center">
                  Sandbox Default PIN: <strong>12121</strong>
                </p>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#E2136E] hover:bg-[#c70f5e] text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20 active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Processing Payment...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm ৳{parseFloat(amount).toLocaleString()} Payment</span>
                  </>
                )}
              </button>
            </div>
          )}

          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full py-2.5 text-xs text-slate-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
          >
            Cancel Payment &amp; Return
          </button>
        </div>

        {/* Security Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secured by bKash Payment Gateway</span>
        </div>
      </div>
    </div>
  );
}

