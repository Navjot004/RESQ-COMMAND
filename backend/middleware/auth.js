const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify Bearer JWT token and attach authenticated User to req.user
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication required: Missing or invalid Bearer token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'default-secret-key';
    const decoded = jwt.verify(token, secret);

    const userId = decoded.id || decoded.sub || decoded.userId;
    if (!userId) {
      return res.status(401).json({ detail: 'Token payload missing user identifier' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ detail: 'User belonging to this token no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ detail: 'Session expired: Token has expired' });
    }
    return res.status(401).json({ detail: 'Authentication failed: Token is invalid' });
  }
};

/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 * @param  {...string} allowedRoles Allowed user roles (e.g. 'COMMANDER', 'COORDINATOR')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ detail: 'Authentication required' });
    }

    const userRole = String(req.user.role).toUpperCase();
    const upperAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!upperAllowed.includes(userRole)) {
      return res.status(403).json({
        detail: `Access forbidden: Role '${req.user.role}' lacks required permissions. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles,
};
