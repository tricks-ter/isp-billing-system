import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { paymentApi } from '../services/paymentApi';
import Button from './Button';
import toast from 'react-hot-toast';
import { Wallet, CreditCard, Smartphone, Building2 } from 'lucide-react';

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['CASH', 'BKASH', 'NAGAD', 'BANK'], { required_error: 'Please select a method' }),
  notes: z.string().optional(),
});

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: Wallet, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'BKASH', label: 'bKash', icon: Smartphone, color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'NAGAD', label: 'Nagad', icon: Smartphone, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'BANK', label: 'Bank', icon: Building2, color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

export default function PaymentForm({ invoice, onSuccess, onCancel }) {
  const paidAmount = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const dueAmount = invoice.total - paidAmount;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amount: dueAmount, method: 'CASH', notes: '' },
  });

  const selectedMethod = watch('method');

  const recordMutation = useMutation({
    mutationFn: (data) => paymentApi.record({ ...data, invoiceId: invoice.id }),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Payment recorded successfully');
      onSuccess();
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Failed to record payment'),
  });

  return (
    <form onSubmit={handleSubmit((data) => recordMutation.mutate(data))} className="space-y-4">
      {/* Invoice Info */}
      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Customer</span>
          <span className="font-medium text-slate-900">{invoice.customer.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Month</span>
          <span className="font-medium text-slate-900">{invoice.month}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Total Amount</span>
          <span className="font-medium text-slate-900">৳{invoice.total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Already Paid</span>
          <span className="font-medium text-green-600">৳{paidAmount}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
          <span className="text-slate-700 font-medium">Due Now</span>
          <span className="font-bold text-red-600 text-lg">৳{dueAmount}</span>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Payment Amount (৳) <span className="text-red-500">*</span>
        </label>
        <input
          {...register('amount', { valueAsNumber: true })}
          type="number"
          step="0.01"
          max={dueAmount}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg font-semibold"
        />
        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        <button
          type="button"
          onClick={() => setValue('amount', dueAmount)}
          className="text-xs text-primary hover:underline mt-1"
        >
          Pay full due: ৳{dueAmount}
        </button>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Payment Method <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {paymentMethods.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => setValue('method', method.value)}
              className={`
                p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-1
                ${selectedMethod === method.value
                  ? `${method.color} border-current`
                  : 'bg-white border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <method.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{method.label}</span>
            </button>
          ))}
        </div>
        {errors.method && <p className="text-xs text-red-500 mt-1">{errors.method.message}</p>}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
        <textarea
          {...register('notes')}
          rows="2"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Transaction ID, reference, etc."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={onCancel} type="button">Cancel</Button>
        <Button type="submit" isLoading={recordMutation.isPending}>Record Payment</Button>
      </div>
    </form>
  );
}