const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PendingUser } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { logAction } = require('../services/auditLogService');
const { authRateLimit } = require('../middleware/security');
const logger = require('../utils/logger');

// Get JWT secret from environment or generate one for development
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return require('crypto').randomBytes(64).toString('hex');
})();

const router = express.Router();

// Base path is /api/auth

// Removed dangerous create-admin endpoint for security
// Admin accounts should be created through secure initialization process

// Register user with rate limiting
router.post('/register', authRateLimit, validateRegistration, async (req, res) => {
  try {
    const { name, email, password, isManager = false } = req.body;

    logger.info('Registration attempt', { name, email, isManager });

    // Clean up old pending users (older than 24 hours)
    await PendingUser.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Check if user already exists in approved users
    const existingUser = await User.findOne({ email });
    logger.debug('Existing user check', { email, existingUser: !!existingUser });
    
    if (existingUser) {
      logger.warn('User already exists in approved users', { email });
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists in approved users' 
      });
    }
    
    // Check if user already exists in pending users
    const existingPending = await PendingUser.findOne({ email });
    logger.debug('Existing pending user check', { email, existingPending: !!existingPending });
    
    if (existingPending) {
      logger.warn('User already exists in pending users', { email });
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists in pending requests. Please wait for approval.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create manager account directly if no active managers exist
    if (isManager) {
      const activeManagerCount = await User.countDocuments({ 
        role: 'manager', 
        isApproved: true 
      });
      
      logger.info('Active manager count check', { activeManagerCount });
      
      if (activeManagerCount === 0) {
        const manager = new User({
          name,
          email,
          password: hashedPassword,
          role: 'manager',
          isApproved: true,
          status: 'online'
        });
        
        await manager.save();
        logger.info('Manager account created successfully', { email });
        
        return res.status(201).json({ 
          success: true,
          message: 'Manager account created successfully' 
        });
      } else {
        logger.warn('Active manager already exists', { email });
        return res.status(400).json({ 
          success: false,
          error: 'Active manager account already exists' 
        });
      }
    }

    // Create pending user for employees
    const pendingUser = new PendingUser({
      name,
      email,
      password: hashedPassword,
      role: 'employee',
      status: 'pending'
    });

    await pendingUser.save();
    logger.info('Pending user created successfully', { email });
    
    res.status(201).json({ 
      success: true,
      message: 'Registration request submitted for approval' 
    });

  } catch (error) {
    logger.error('Registration error', { error: error.message, email, isManager });
    
    // Handle duplicate key error
    if (error.code === 11000) {
      logger.warn('Duplicate key error detected', { email });
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Login endpoint with rate limiting
router.post('/login', authRateLimit, validateLogin, async (req, res) => {
  const { email, password } = req.body;
  
  // Check if MongoDB is available - provide mock login for development
  if (global.mongodbAvailable === false) {
    logger.warn('Login attempt without MongoDB connection - using mock authentication', { email });
    
    // Mock authentication for development
    if (email === 'admin@app.com' && password === 'admin123') {
      const mockUser = {
        _id: 'mock-admin-id',
        name: 'Admin User',
        email: 'admin@app.com',
        role: 'manager',
        isManager: true,
        isApproved: true
      };
      
      const token = jwt.sign(
        { 
          userId: mockUser._id, 
          email: mockUser.email, 
          role: mockUser.role,
          isManager: mockUser.isManager 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        token,
        user: {
          id: mockUser._id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          isManager: mockUser.isManager
        }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials (Database offline - use admin@app.com / admin123)'
    });
  }
  
  try {

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    logger.info('Login attempt', { email, userFound: !!user, isApproved: user?.isApproved });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials or account not approved' 
      });
    }
    
    if (!user.isApproved) {
      return res.status(401).json({ 
        success: false,
        error: 'Account not approved' 
      });
    }

    // Check password
    logger.debug('Password check', { email, hasPassword: !!user.password });
    const isValidPassword = await bcrypt.compare(password, user.password);
    logger.debug('Password validation result', { email, isValid: isValidPassword });
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    await logAction(user._id, 'user.login', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (error) {
    logger.error('Login error', { error: error.message, email });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;