const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PendingUser } = require('../models');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { logAction } = require('../services/auditLogService');

const router = express.Router();

// Base path is /api/auth

// Create admin endpoint
router.post('/create-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Remove existing managers
    await User.deleteMany({ role: 'manager' });
    
    // Create new admin
    const newAdmin = new User({
      name: 'Super Admin',
      email: 'admin@app.com',
      password: hashedPassword,
      role: 'manager',
      avatar: '',
      status: 'online',
      isApproved: true
    });
    
    await newAdmin.save();
    
    res.json({ 
      success: true,
      message: 'Admin created successfully',
      credentials: {
        email: 'admin@app.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create admin' 
    });
  }
});

// Register user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, isManager = false } = req.body;

    console.log('Registration attempt:', { name, email, isManager });

    // Clean up old pending users (older than 24 hours)
    await PendingUser.deleteMany({
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // Check if user already exists in approved users
    const existingUser = await User.findOne({ email });
    console.log('Existing user check:', { existingUser: !!existingUser });
    
    if (existingUser) {
      console.log('User already exists in approved users');
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists in approved users' 
      });
    }
    
    // Check if user already exists in pending users
    const existingPending = await PendingUser.findOne({ email });
    console.log('Existing pending user check:', { existingPending: !!existingPending });
    
    if (existingPending) {
      console.log('User already exists in pending users');
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
      
      console.log('Active manager count:', activeManagerCount);
      
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
        console.log('Manager account created successfully');
        
        return res.status(201).json({ 
          success: true,
          message: 'Manager account created successfully' 
        });
      } else {
        console.log('Active manager already exists');
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
    console.log('Pending user created successfully');
    
    res.status(201).json({ 
      success: true,
      message: 'Registration request submitted for approval' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      console.log('Duplicate key error detected');
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

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    
    console.log('Login attempt:', { email, userFound: !!user, isApproved: user?.isApproved });
    
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
    console.log('Password check:', { hasPassword: !!user.password, passwordLength: user.password?.length });
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isValidPassword);
    
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
    console.error('Login error:', error);
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
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router; 