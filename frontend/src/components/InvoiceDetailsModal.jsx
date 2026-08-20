import { useState } from 'react';
import { Printer, Calendar, User, CreditCard } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';

export default function InvoiceDetailsModal({ invoice }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const paidAmount = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const dueAmount = invoice.total - paidAmount;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <div>
      {/* Print Button - Hidden during print */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button variant="outline" onClick={handlePrint} isLoading={isPrinting}>
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </Button>
      </div>

      {/* Receipt Content */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md mx-auto print:border-0 print:shadow-none print:p-0">
        {/* Header */}
        <div className="text-center border-b border-slate-200 pb-4 mb-4">
          <h2 className="text-xl font-bold text-slate-900">ISP Billing System</h2>
          <p className="text-xs text-slate-500 mt-1">Payment Invoice / Receipt</p>
        </div>

        {/* Invoice Info */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice Month:</span>
            <span className="font-medium">{invoice.month}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Issue Date:</span>
            <span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Due Date:</span>
            <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Status:</span>
            <Badge variant={invoice.status === 'PAID' ? 'success' : invoice.status === 'PARTIAL' ? 'warning' : 'danger'}>
              {invoice.status}
            </Badge>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">{invoice.customer.name}</span>
          </div>
          <div className="text-xs text-slate-600 space-y-0.5 pl-6">
            <p>📞 {invoice.customer.phone}</p>
            <p>🌐 PPPoE: {invoice.customer.pppoeUsername}</p>
            <p>📦 Package: {invoice.customer.package?.name} ({invoice.customer.package?.speed})</p>
            {invoice.customer.address && <p>📍 {invoice.customer.address}</p>}
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="border-t border-slate-200 pt-3 mb-4">
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-slate-600">Package Charge</td>
                <td className="py-1 text-right font-medium">৳{invoice.amount}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr>
                  <td className="py-1 text-slate-600">Discount</td>
                  <td className="py-1 text-right text-red-600">-৳{invoice.discount}</td>
                </tr>
              )}
              {invoice.vat > 0 && (
                <tr>
                  <td className="py-1 text-slate-600">VAT</td>
                  <td className="py-1 text-right font-medium">৳{invoice.vat}</td>
                </tr>
              )}
              <tr className="border-t border-slate-200">
                <td className="py-2 font-semibold text-slate-900">Total</td>
                <td className="py-2 text-right font-bold text-lg">৳{invoice.total}</td>
              </tr>
              <tr>
                <td className="py-1 text-green-600">Paid</td>
                <td className="py-1 text-right font-medium text-green-600">৳{paidAmount}</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-2 font-semibold text-red-600">Due</td>
                <td className="py-2 text-right font-bold text-red-600">৳{dueAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment History */}
        {invoice.payments?.length > 0 && (
          <div className="border-t border-slate-200 pt-3 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center space-x-1">
              <CreditCard className="w-4 h-4" />
              <span>Payment History</span>
            </h3>
            <div className="space-y-1.5">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-xs bg-slate-50 rounded p-2">
                  <div>
                    <p className="font-medium text-slate-900">৳{payment.amount} via {payment.method}</p>
                    <p className="text-slate-500">
                      {new Date(payment.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {payment.notes && <p className="text-slate-500 italic">Note: {payment.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-3 border-t border-slate-200">
          <p>Thank you for your business!</p>
          <p className="mt-1">Printed on {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    </div>
  );
}