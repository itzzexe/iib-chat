const express = require('express');
const mongoose = require('mongoose');
const { User, PendingUser, UserSettings } = require('../models');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { validateObjectId, validateUserSettings } = require('../middleware/validation');
const { uploadAvatar, handleUploadError } = require('../middleware/upload');
const { logAction } = require('../services/auditLogService');
const logger = require('../utils/logger');

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get current user error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get all approved users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ isApproved: true })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    logger.error('Get users error', { error: error.message, userId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user error', { error: error.message, targetUserId: req.params.id, userId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user
router.put('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields from updates
    delete updates.password;
    delete updates.role; // Role should be updated via separate endpoint
    delete updates.isApproved;
    
    // Users can only update their own profile unless they're a manager
    if (req.user.userId !== id && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: new Date() }, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Update user error', { error: error.message, userId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user role (manager only)
router.patch('/:id/role', authenticateToken, requireManager, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !['manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Prevent changing admin role
    if (user.email === 'admin@app.com') {
      return res.status(403).json({
        success: false,
        error: 'Cannot change admin role'
      });
    }
    
    const previousRole = user.role;
    user.role = role;
    await user.save();
    
    logger.info('User role updated', { 
      userName: user.name, 
      userEmail: user.email, 
      previousRole, 
      newRole: role,
      updatedBy: req.user.userId 
    });
    
    await logAction(req.user.userId, 'user.role.updated', id, { oldRole: previousRole, newRole: role });

    // Fetch the updated user to ensure we return the latest data
    const updatedUser = await User.findById(id).select('-password');
    
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    logger.error('Update user role error', { error: error.message, userId: id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Delete user (manager only)
router.delete('/:id', authenticateToken, requireManager, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Prevent deleting admin
    if (user.email === 'admin@app.com') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin user'
      });
    }
    
    await User.findByIdAndDelete(id);
    
    await logAction(req.user.userId, 'user.deleted', id, { deletedUserName: user.name });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error', { error: error.message, userId: id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get pending users (manager only)
router.get('/pending/list', authenticateToken, requireManager, async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: pendingUsers
    });
  } catch (error) {
    logger.error('Get pending users error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Approve pending user (manager only)
router.post('/pending/:id/approve', authenticateToken, requireManager, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const pendingUser = await PendingUser.findById(id);
    
    if (!pendingUser) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending user not found' 
      });
    }

    // Create new user
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password, // Already hashed
      role: pendingUser.role,
      isApproved: true,
      status: 'offline'
    });

    await newUser.save();
    
    // Remove from pending users
    await PendingUser.findByIdAndDelete(id);

    await logAction(req.user.userId, 'user.approved', newUser._id, { approvedUserName: newUser.name });

    res.json({
      success: true,
      message: 'User approved successfully',
      data: newUser.toJSON()
    });
  } catch (error) {
    logger.error('Approve user error', { error: error.message, userId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Reject pending user (manager only)
router.post('/pending/:id/reject', authenticateToken, requireManager, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await PendingUser.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ 
        success: false,
        error: 'Pending user not found' 
      });
    }
    
    await logAction(req.user.userId, 'user.rejected', id, { rejectedUserName: result.name });

    res.json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    logger.error('Reject user error', { error: error.message, userId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get user settings
router.get('/:id/settings', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own settings unless they're a manager
    if (req.user.userId !== id && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    let settings = await UserSettings.findOne({ userId: id });
    
    // Create default settings if none exist
    if (!settings) {
      settings = new UserSettings({ userId: id });
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get user settings error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user settings
router.put('/:id/settings', authenticateToken, validateObjectId(), validateUserSettings, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only update their own settings unless they're a manager
    if (req.user.userId !== id && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const settings = await UserSettings.findOneAndUpdate(
      { userId: id },
      { ...req.body, updatedAt: new Date() },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Update user settings error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update user avatar - disabled, always use initials
router.put('/me/avatar', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Always clear avatar to force using initials
    user.avatar = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar cleared - using initials',
      data: user.toJSON()
    });

  } catch (error) {
    logger.error('Update avatar error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;