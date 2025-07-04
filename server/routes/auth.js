const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, PendingUser } = require('../models');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { JWT_SECRET } = require('../middleware/auth');
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

    // Check if user already exists
    const [existingUser, existingPending] = await Promise.all([
      User.findOne({ email }),
      PendingUser.findOne({ email })
    ]);
    
    if (existingUser || existingPending) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already exists' 
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
        
        return res.status(201).json({ 
          success: true,
          message: 'Manager account created successfully' 
        });
      } else {
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
      role: 'employee'
    });

    await pendingUser.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Registration request submitted for approval' 
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
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

    // Find user
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isApproved) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials or account not approved' 
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
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