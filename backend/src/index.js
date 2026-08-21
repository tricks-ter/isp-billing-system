require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import all route modules
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const packageRoutes = require('./routes/packageRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const routerRoutes = require('./routes/routerRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');
const financeRoutes = require('./routes/financeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// --- Middleware ---
app.use(helmet());

// FIXED: Proper CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://isp-billing-frontend-0f1m.onrender.com',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/routers', routerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ISP Billing API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('❌ Unhandled Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 ISP Billing API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 MikroTik Mock Mode: ${process.env.MIKROTIK_MOCK_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log(` SMS Mock Mode: ${process.env.SMS_MOCK_MODE !== 'false' ? 'ENABLED' : 'DISABLED'}`);
});