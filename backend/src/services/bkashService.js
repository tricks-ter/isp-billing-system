// FILE: ./backend/src/services/bkashService.js
const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../config/db');
const mikrotikService = require('./mikrotikService');
const oltService = require('./oltService');
const smsService = require('./smsService');

class BkashService {
  constructor() {
    const backendBase = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3001';
    this.baseUrl = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized';
    this.appKey = process.env.BKASH_APP_KEY || '4f6o0cjiki2rfm34kfdadl1eqq';
    this.appSecret = process.env.BKASH_APP_SECRET || '2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b';
    this.username = process.env.BKASH_USERNAME || 'sandboxTokenizedUser02';
    this.password = process.env.BKASH_PASSWORD || 'sandboxTokenizedUser02@12345';
    this.callbackUrl = process.env.BKASH_CALLBACK_URL || `${backendBase}/api/bkash/callback`;
    this.frontendUrl = process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || 'http://localhost:5173';
    this.isMockMode = process.env.BKASH_MOCK_MODE === 'true';

    // In-memory token cache
    this.token = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Helper to ensure invoice has a secure public token
   */
  async ensureInvoicePublicToken(invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(invoiceId) } });
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.publicToken) return invoice.publicToken;

    const publicToken = `inv_${crypto.randomBytes(16).toString('hex')}`;
    await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: { publicToken },
    });
    return publicToken;
  }

  async getOrCreateInvoicePublicToken(invoiceId) {
    return await this.ensureInvoicePublicToken(invoiceId);
  }

  /**
   * Grant / Refresh Token with bKash PGW
   */
  async getValidToken() {
    // If cached token is valid for at least 5 more minutes, reuse it
    if (this.token && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) {
      return this.token;
    }

    if (this.isMockMode) {
      this.token = `mock_id_token_${Date.now()}`;
      this.tokenExpiresAt = Date.now() + 3600 * 1000;
      return this.token;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/token/grant`,
        {
          app_key: this.appKey,
          app_secret: this.appSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            username: this.username,
            password: this.password,
          },
          timeout: 30000,
        }
      );

      if (response.data && response.data.id_token) {
        this.token = response.data.id_token;
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiresAt = Date.now() + expiresIn * 1000;
        return this.token;
      } else {
        throw new Error(response.data?.statusMessage || 'Failed to grant bKash token');
      }
    } catch (error) {
      console.error('bKash Grant Token Error:', error.response?.data || error.message);
      // If external sandbox fails, gracefully fallback to mock token in dev
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Falling back to bKash Mock Mode due to network timeout/unreachability');
        this.token = `mock_id_token_${Date.now()}`;
        this.tokenExpiresAt = Date.now() + 3600 * 1000;
        return this.token;
      }
      throw new Error(`bKash Token Grant Failed: ${error.response?.data?.statusMessage || error.message}`);
    }
  }

  /**
   * Create Payment (Initiate Checkout)
   */
  async createPayment({ invoiceId, customAmount = null, payerReference = null, userId = null }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: {
        customer: true,
        payments: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = invoice.total - totalPaid;

    if (dueAmount <= 0) {
      throw new Error('This invoice is already fully paid');
    }

    const payAmount = customAmount ? Math.min(parseFloat(customAmount), dueAmount) : dueAmount;
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    const merchantInvoiceNumber = `INV-${invoice.id}-${Date.now().toString().slice(-6)}`;
    const payerRef = payerReference || invoice.customer.phone || '01700000000';

    // Mock Mode flow
    if (this.isMockMode || this.token?.startsWith('mock_id_token')) {
      const mockPaymentId = `BK_MOCK_${Date.now()}_${invoice.id}`;
      const mockRedirectUrl = `${this.frontendUrl}/payment/mock-bkash?paymentID=${mockPaymentId}&amount=${payAmount.toFixed(2)}&invoiceId=${invoice.id}&invoiceNumber=${merchantInvoiceNumber}`;
      return {
        success: true,
        paymentID: mockPaymentId,
        bkashURL: mockRedirectUrl,
        amount: payAmount.toFixed(2),
        merchantInvoiceNumber,
        invoiceId: invoice.id,
        isMock: true,
      };
    }

    const idToken = await this.getValidToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/create`,
        {
          mode: '0011',
          payerReference: payerRef,
          callbackURL: this.callbackUrl,
          amount: payAmount.toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: idToken,
            'x-app-key': this.appKey,
          },
          timeout: 30000,
        }
      );

      const data = response.data;
      if (data && data.paymentID && data.bkashURL) {
        return {
          success: true,
          paymentID: data.paymentID,
          bkashURL: data.bkashURL,
          amount: data.amount,
          merchantInvoiceNumber,
          invoiceId: invoice.id,
        };
      } else {
        throw new Error(data?.statusMessage || 'bKash failed to generate payment URL');
      }
    } catch (error) {
      console.error('bKash Create Payment Error:', error.response?.data || error.message);
      // Dev mock fallback if sandbox is down
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Sandbox create payment failed, falling back to simulated checkout');
        const mockPaymentId = `BK_MOCK_${Date.now()}_${invoice.id}`;
        const mockRedirectUrl = `${this.frontendUrl}/payment/mock-bkash?paymentID=${mockPaymentId}&amount=${payAmount.toFixed(2)}&invoiceId=${invoice.id}&invoiceNumber=${merchantInvoiceNumber}`;
        return {
          success: true,
          paymentID: mockPaymentId,
          bkashURL: mockRedirectUrl,
          amount: payAmount.toFixed(2),
          merchantInvoiceNumber,
          invoiceId: invoice.id,
          isMock: true,
        };
      }
      throw new Error(`bKash Create Payment Failed: ${error.response?.data?.statusMessage || error.message}`);
    }
  }

  /**
   * Execute Payment (Confirm & Finalize Transaction)
   */
  async executePayment(paymentId) {
    if (!paymentId) throw new Error('paymentID is required');

    // Mock Mode Execution
    if (paymentId.startsWith('BK_MOCK_')) {
      const parts = paymentId.split('_');
      const invoiceId = parseInt(parts[parts.length - 1], 10);
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { customer: true, payments: true },
      });

      const totalPaid = invoice ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
      const due = invoice ? invoice.total - totalPaid : 500;

      return {
        statusCode: '0000',
        statusMessage: 'Successful',
        paymentID: paymentId,
        trxID: `TRX_BK_${Date.now().toString(36).toUpperCase()}`,
        amount: due.toFixed(2),
        currency: 'BDT',
        intent: 'sale',
        paymentExecuteTime: new Date().toISOString(),
        merchantInvoiceNumber: `INV-${invoiceId}-MOCK`,
        payerType: 'Customer',
        payerReference: invoice?.customer?.phone || '01712345678',
        customerMsisdn: invoice?.customer?.phone || '01712345678',
        transactionStatus: 'Completed',
      };
    }

    const idToken = await this.getValidToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/checkout/execute`,
        { paymentID: paymentId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: idToken,
            'x-app-key': this.appKey,
          },
          timeout: 30000,
        }
      );

      const data = response.data;
      if (data && (data.statusCode === '0000' || data.transactionStatus === 'Completed')) {
        return data;
      } else {
        throw new Error(data?.statusMessage || 'bKash payment execution failed');
      }
    } catch (error) {
      console.error('bKash Execute Payment Error:', error.response?.data || error.message);
      throw new Error(`bKash Execution Error: ${error.response?.data?.statusMessage || error.message}`);
    }
  }

  /**
   * Process Successful bKash Payment in Database & Auto-Restore Hardware Lines
   */
  async processPaymentSuccess(executeResult, systemUserId = null) {
    const { paymentID, trxID, amount, merchantInvoiceNumber, customerMsisdn } = executeResult;

    // Check if transaction ID has already been credited (Idempotency & Replay Protection)
    const existingPayment = await prisma.payment.findUnique({
      where: { trxId: trxID },
    });
    if (existingPayment) {
      return { success: true, payment: existingPayment, message: 'Transaction already processed' };
    }

    // Extract invoice ID from merchantInvoiceNumber (Format: INV-1001-XXXXXX)
    const invoiceIdMatch = merchantInvoiceNumber ? merchantInvoiceNumber.match(/INV-(\d+)/) : null;
    let invoice = null;

    if (invoiceIdMatch && invoiceIdMatch[1]) {
      invoice = await prisma.invoice.findUnique({
        where: { id: parseInt(invoiceIdMatch[1], 10) },
        include: {
          customer: { include: { router: true, olt: true } },
          payments: true,
        },
      });
    }

    if (!invoice) {
      throw new Error(`Could not locate invoice for merchant invoice reference: ${merchantInvoiceNumber}`);
    }

    const payAmount = parseFloat(amount);
    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const newTotalPaid = currentPaid + payAmount;
    const isFullyPaid = newTotalPaid >= invoice.total;

    let customerRestored = false;

    // 1. ATOMIC DATABASE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // Create Payment Record
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: payAmount,
          method: 'BKASH',
          trxId: trxID,
          gatewayPaymentId: paymentID,
          gatewayStatus: 'COMPLETED',
          gatewayCustomerPhone: customerMsisdn,
          receivedBy: systemUserId || null,
          notes: `Paid online via bKash PGW (Trx: ${trxID})`,
        },
      });

      // Update Invoice Status
      const newStatus = isFullyPaid ? 'PAID' : 'PARTIAL';
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });

      // Restore Customer if was SUSPENDED
      if (isFullyPaid && invoice.customer.status === 'SUSPENDED') {
        await tx.customer.update({
          where: { id: invoice.customer.id },
          data: { status: 'ACTIVE' },
        });
        customerRestored = true;
      }

      return payment;
    });

    // 2. HARDWARE AUTO-RESTORATION HOOKS (Triggered ONLY after DB commit)
    if (customerRestored) {
      // A. Restore MikroTik PPPoE if router assigned
      if (invoice.customer.routerId && invoice.customer.router) {
        try {
          await mikrotikService.enablePppoeSecret(
            invoice.customer.router,
            invoice.customer.pppoeUsername
          );
          console.log(`✅ [bKash Auto-Restore] MikroTik PPPoE enabled for ${invoice.customer.name}`);
        } catch (err) {
          console.error(`❌ [bKash Auto-Restore] Failed to enable MikroTik PPPoE:`, err.message);
        }
      }

      // B. Restore BDCOM OLT ONU Port if OLT assigned
      if (invoice.customer.oltId) {
        try {
          const onu = await prisma.onu.findFirst({ where: { customerId: invoice.customer.id } });
          if (onu) {
            await oltService.toggleCustomerOnu(invoice.customer.id, 'enable');
            console.log(`✅ [bKash Auto-Restore] BDCOM OLT ONU Port enabled for ${invoice.customer.name}`);
          }
        } catch (err) {
          console.error(`❌ [bKash Auto-Restore] Failed to enable BDCOM OLT ONU:`, err.message);
        }
      }
    }

    // 3. Send SMS Notification
    try {
      const smsText = `Dear ${invoice.customer.name}, we received your payment of ৳${payAmount} via bKash (TrxID: ${trxID}). Your internet status is ACTIVE. Thank you!`;
      await smsService.sendSms(invoice.customer.phone, smsText);
    } catch (smsErr) {
      console.warn('Could not send bKash payment SMS:', smsErr.message);
    }

    // 4. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: systemUserId || 1,
          action: 'BKASH_PAYMENT_SUCCESS',
          details: JSON.stringify({
            paymentId: result.id,
            trxID,
            invoiceId: invoice.id,
            customerId: invoice.customer.id,
            amount: payAmount,
          }),
        },
      });
    } catch (auditErr) {
      console.error('Failed to write audit log:', auditErr);
    }

    return {
      success: true,
      payment: result,
      invoiceId: invoice.id,
      customerId: invoice.customer.id,
      customerName: invoice.customer.name,
      amount: payAmount,
      trxID,
    };
  }

  /**
   * Query Payment Details
   */
  async queryPayment(paymentId) {
    if (!paymentId) throw new Error('paymentID is required');
    const idToken = await this.getValidToken();

    const response = await axios.post(
      `${this.baseUrl}/checkout/payment/query`,
      { paymentID: paymentId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: idToken,
          'x-app-key': this.appKey,
        },
        timeout: 30000,
      }
    );
    return response.data;
  }

  /**
   * Get Public Invoice Info by Secure Token (For Customer Self-Service Portal)
   */
  async getInvoiceByPublicToken(publicToken) {
    if (!publicToken) throw new Error('Invalid public token');

    const invoice = await prisma.invoice.findUnique({
      where: { publicToken },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            area: true,
            status: true,
            package: { select: { id: true, name: true, speed: true, price: true } },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            trxId: true,
            date: true,
          },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found or expired');

    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, invoice.total - totalPaid);

    return {
      id: invoice.id,
      publicToken: invoice.publicToken,
      month: invoice.month,
      amount: invoice.amount,
      discount: invoice.discount,
      vat: invoice.vat,
      total: invoice.total,
      totalPaid,
      dueAmount,
      dueDate: invoice.dueDate,
      status: invoice.status,
      customer: invoice.customer,
      payments: invoice.payments,
    };
  }
}

module.exports = new BkashService();

