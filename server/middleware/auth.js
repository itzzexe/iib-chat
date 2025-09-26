const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const logger = require('../utils/logger');

// Generate a secure JWT secret if not provided
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  logger.warn('Using generated JWT secret for development. Set JWT_SECRET environment variable for production.');
  return crypto.randomBytes(64).toString('hex');
})();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url
      });
      return res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        logger.warn('Authentication failed: Invalid token', {
          error: err.message,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url
        });
        return res.status(403).json({ 
          success: false,
          error: 'Invalid or expired token' 
        });
      }
      
      // Verify user still exists and is approved
      try {
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isApproved) {
          logger.warn('Authentication failed: User not found or not approved', {
            userId: decoded.userId,
            ip: req.ip,
            url: req.url
          });
          return res.status(403).json({ 
            success: false,
            error: 'User account not found or not approved' 
          });
        }
        
        req.user = {
          userId: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        };
        next();
      } catch (dbError) {
        logger.error('Database error during authentication', {
          error: dbError.message,
          userId: decoded.userId
        });
        return res.status(500).json({ 
          success: false,
          error: 'Internal server error' 
        });
      }
    });
  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn('Authorization failed: No user in request', {
        ip: req.ip,
        url: req.url
      });
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    if (req.user.role !== role) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRole: role,
        ip: req.ip,
        url: req.url
      });
      return res.status(403).json({ 
        success: false,
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

const requireManager = requireRole('manager');

module.exports = {
  authenticateToken,
  requireRole,
  requireManager
  // JWT_SECRET is not exported for security
};