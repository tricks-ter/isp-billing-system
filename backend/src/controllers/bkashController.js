// FILE: ./backend/src/controllers/bkashController.js
const bkashService = require('../services/bkashService');
const prisma = require('../config/db');

class BkashController {
  /**
   * Create bKash Payment
   * POST /api/bkash/create
   */
  async createPayment(req, res) {
    try {
      const { invoiceId, customAmount, payerReference } = req.body;
      if (!invoiceId) {
        return res.status(400).json({ success: false, message: 'invoiceId is required' });
      }

      const userId = req.user ? req.user.id : null;
      const result = await bkashService.createPayment({
        invoiceId,
        customAmount,
        payerReference,
        userId,
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'bKash payment initiated successfully',
      });
    } catch (error) {
      console.error('Error creating bKash payment:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to initiate bKash payment',
      });
    }
  }

  /**
   * bKash Callback Endpoint (User redirected from bKash payment page)
   * GET/POST /api/bkash/callback
   */
  async handleCallback(req, res) {
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://isp-billing-frontend-0f1m.onrender.com' : 'http://localhost:5173');
    try {
      const paymentID = req.query.paymentID || req.body.paymentID;
      const status = req.query.status || req.body.status;

      if (!paymentID) {
        return res.redirect(`${frontendUrl}/payment/failed?message=Missing+Payment+ID`);
      }

      if (status === 'cancel') {
        return res.redirect(`${frontendUrl}/payment/failed?message=Payment+cancelled+by+customer`);
      }

      if (status === 'failure') {
        return res.redirect(`${frontendUrl}/payment/failed?message=Payment+failed+or+insufficient+balance`);
      }

      if (status === 'success') {
        // Execute Payment
        const executeResult = await bkashService.executePayment(paymentID);

        // Process in Database and Auto-Restore hardware
        const processed = await bkashService.processPaymentSuccess(executeResult);

        return res.redirect(
          `${frontendUrl}/payment/success?trxID=${processed.trxID}&amount=${processed.amount}&customer=${encodeURIComponent(processed.customerName || '')}&invoiceId=${processed.invoiceId}`
        );
      }

      return res.redirect(`${frontendUrl}/payment/failed?message=Unknown+payment+status`);
    } catch (error) {
      console.error('Error in bKash callback handler:', error);
      return res.redirect(
        `${frontendUrl}/payment/failed?message=${encodeURIComponent(error.message || 'Payment processing error')}`
      );
    }
  }

  /**
   * Query Payment Details
   * GET /api/bkash/query/:paymentId
   */
  async queryPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const result = await bkashService.queryPayment(paymentId);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Get Public Invoice by Secure Token
   * GET /api/bkash/public-invoice/:token
   */
  async getPublicInvoice(req, res) {
    try {
      const { token } = req.params;
      const invoice = await bkashService.getInvoiceByPublicToken(token);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  /**
   * Generate / Get Quick Pay Link for an Invoice
   * POST /api/bkash/generate-link/:invoiceId
   */
  async generateQuickPayLink(req, res) {
    try {
      const { invoiceId } = req.params;
      const publicToken = await bkashService.ensureInvoicePublicToken(invoiceId);
      const frontendUrl = process.env.APP_FRONTEND_URL || 'http://localhost:5173';
      const quickPayUrl = `${frontendUrl}/pay/${publicToken}`;

      return res.status(200).json({
        success: true,
        data: {
          invoiceId: parseInt(invoiceId),
          publicToken,
          quickPayUrl,
        },
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new BkashController();

