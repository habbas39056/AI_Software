const jwt = require('jsonwebtoken');
const { Customer } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // If user is a client, check their subscription
    if (decoded.role === 'Client') {
      const client = await Customer.findByPk(decoded.customerId);
      if (!client) {
        console.error('Auth Middleware: Client not found for ID:', decoded.customerId);
        return res.status(403).json({ message: 'Access Denied: Client record not found.' });
      }

      // Check if manually suspended or expired
      const isExpired = client.subscriptionExpiry && new Date(client.subscriptionExpiry) < new Date();
      const isSuspended = client.subscriptionStatus === 'Suspended' || isExpired;

      // Allow /auth/user to pass through so frontend can show the Locked screen
      // Block everything else
      if (isSuspended && !req.originalUrl.includes('/auth/user')) {
        return res.status(403).json({ 
          message: 'Subscription Blocked: Your portal has been suspended due to expiry. Please contact admin to renew.',
          isExpired: true
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticate;
