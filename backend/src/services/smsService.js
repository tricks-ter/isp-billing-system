const fs = require('fs').promises;
const path = require('path');

class SmsService {
  constructor() {
    this.mockMode = process.env.SMS_MOCK_MODE !== 'false'; // Default to mock
    this.logFile = path.join(__dirname, '../../logs/sms-operations.log');
    fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(() => {});
  }

  async log(phone, message, result) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] TO: ${phone} | MSG: ${message} | RESULT: ${JSON.stringify(result)}\n`;
    try {
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write SMS log:', error);
    }
  }

  async sendSms(phone, message) {
    if (this.mockMode) {
      const result = { success: true, mock: true, messageId: `mock_${Date.now()}` };
      await this.log(phone, message, result);
      console.log(`[SMS MOCK] To: ${phone} | Message: ${message}`);
      return result;
    }

    // TODO: Integrate with real SMS provider (SSL Wireless, BulkSMSBD, etc.)
    throw new Error('Real SMS integration not yet configured');
  }

  async sendDueReminders() {
    const prisma = require('../config/db');
    
    // Find customers with unpaid invoices due within 3 days
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    const dueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: { lte: threeDaysLater },
      },
      include: {
        customer: true,
        payments: true,
      },
    });

    const results = { sent: 0, failed: 0 };

    for (const invoice of dueInvoices) {
      const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      const dueAmount = invoice.total - paidAmount;

      if (dueAmount <= 0) continue;

      const message = `প্রিয় গ্রাহক, আপনার ${invoice.month} মাসের বিল ৳${dueAmount} আগামী ${invoice.dueDate.toLocaleDateString('en-GB')} তারিখে পরিশোধযোগ্য। অনুগ্রহ করে সময়মত বিল পরিশোধ করুন। - ISP Billing`;

      try {
        await this.sendSms(invoice.customer.phone, message);
        results.sent++;
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  }
}

module.exports = new SmsService();