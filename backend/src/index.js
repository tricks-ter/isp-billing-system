require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import all route modules
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const packageRoutes = require('./routes/packageRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const routerRoutes = require('./routes/routerRoutes');

// Phase 6: New auxiliary routes
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');
const financeRoutes = require('./routes/financeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(helmet()); // Security headers

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://yourdomain.com' // Replace with your actual frontend domain in production
    : 'http://localhost:5173', // Vite dev server
  credentials: true,
}));

// Parse JSON bodies (increased limit to 10mb to handle larger payloads safely)
app.use(express.json({ limit: '10mb' }));

// HTTP request logging
app.use(morgan('dev'));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/routers', routerRoutes);

// Phase 6: Register new auxiliary routes
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/notifications', notificationRoutes);

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
  console.log(`📱 SMS Mock Mode: ${process.env.SMS_MOCK_MODE !== 'false' ? 'ENABLED' : 'DISABLED'}`);
});