// backend/src/middleware/customerAuthMiddleware.js
const jwt = require('jsonwebtoken');

const customerAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access denied. Please login to your customer account.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'CUSTOMER' || !decoded.customerId) {
      return res.status(403).json({ success: false, message: 'Invalid customer session token.' });
    }

    req.customer = {
      id: decoded.customerId,
      pppoeUsername: decoded.pppoeUsername,
      phone: decoded.phone,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Customer session expired. Please login again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid session token.' });
  }
};

module.exports = customerAuthMiddleware;

