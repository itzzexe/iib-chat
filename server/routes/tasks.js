const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');

// Get all tasks for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assignedTo, teamId, dueDate, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by priority
    if (priority) {
      query.priority = priority;
    }
    
    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo;
    } else {
      // If no specific user, show tasks assigned to current user
      query.assignedTo = req.user.userId;
    }
    
    // Filter by team
    if (teamId) {
      query.teamId = teamId;
    }
    
    // Filter by due date
    if (dueDate) {
      const date = new Date(dueDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.dueDate = {
        $gte: date,
        $lt: nextDay
      };
    }
    
    const skip = (page - 1) * limit;
    
    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');
    
    const total = await Task.countDocuments(query);
    
    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get tasks error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .populate('comments.userId', 'name email avatar');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to this task
    if (task.assignedTo !== req.user.userId && task.assignedBy !== req.user.userId && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    logger.error('Get task error', { error: error.message, taskId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      teamId,
      tags,
      isRecurring,
      recurringPattern
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Due date is required'
      });
    }
    
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user is required'
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    // Check if assigned user exists and is approved
    const assignedUser = await User.findOne({ 
      _id: assignedTo, 
      isApproved: true 
    });
    
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        error: 'Assigned user not found or not approved'
      });
    }
    
    // Check if team exists (if teamId is provided)
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(400).json({
          success: false,
          error: 'Team not found'
        });
      }
    }
    
    const task = new Task({
      title,
      description,
      priority: priority || 'medium',
      dueDate: new Date(dueDate),
      assignedTo,
      assignedBy: req.user.userId,
      teamId,
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringPattern: isRecurring ? recurringPattern : null
    });
    
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');
    
    // Emit socket event for real-time updates
    if (req.io) {
      // Broadcast to all users in the tasks room
      req.io.to('tasks').emit('task:created', {
        task: populatedTask,
        createdBy: req.user.userId
      });
      
      // Also emit to assigned user specifically
      if (assignedTo && assignedTo !== req.user.userId) {
        req.io.to(`user:${assignedTo}`).emit('task:assigned', {
          task: populatedTask,
          assignedBy: req.user.userId
        });
      }
      
      logger.info('Task created event emitted to tasks room', {
        taskId: populatedTask.id,
        assignedTo: assignedTo,
        createdBy: req.user.userId,
        taskTitle: populatedTask.title
      });
    } else {
      logger.warn('req.io is not available for task creation event', { taskId: populatedTask.id, createdBy: req.user.userId });
    }
    
    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    logger.error('Create task error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update task
router.put('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user can update this task
    if (task.assignedTo !== req.user.userId && task.assignedBy !== req.user.userId && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assignedTo,
      teamId,
      tags,
      progress
    } = req.body;
    
    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = new Date(dueDate);
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (teamId !== undefined) task.teamId = teamId;
    if (tags !== undefined) task.tags = tags;
    if (progress !== undefined) task.progress = progress;
    
    // Set completed date if status is completed
    if (status === 'completed' && task.status !== 'completed') {
      task.completedDate = new Date();
    }
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');
    
    // Emit socket event for real-time updates
    if (req.io) {
      // Broadcast to all users in the tasks room
      req.io.to('tasks').emit('task:updated', {
        task: updatedTask,
        updatedBy: req.user.userId
      });
      
      logger.info('Task updated event emitted to tasks room', {
        taskId: updatedTask.id,
        updatedBy: req.user.userId,
        taskTitle: updatedTask.title
      });
    }
    
    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Update task error', { error: error.message, taskId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete task
router.delete('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Only task creator or manager can delete
    if (task.assignedBy !== req.user.userId && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    // Emit socket event for real-time updates
    if (req.io) {
      // Broadcast to all users in the tasks room
      req.io.to('tasks').emit('task:deleted', {
        taskId: req.params.id,
        deletedBy: req.user.userId
      });
      
      logger.info('Task deleted event emitted to tasks room', {
        taskId: req.params.id,
        deletedBy: req.user.userId
      });
    }
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Delete task error', { error: error.message, taskId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add comment to task
router.post('/:id/comments', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // Check if user has access to this task
    if (task.assignedTo !== req.user.userId && task.assignedBy !== req.user.userId && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    task.comments.push({
      userId: req.user.userId,
      content: content.trim()
    });
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar')
      .populate('comments.userId', 'name email avatar');
    
    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    logger.error('Add comment error', { error: error.message, taskId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get tasks for calendar view
router.get('/calendar/events', authenticateToken, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    const query = {
      assignedTo: req.user.userId
    };
    
    if (start && end) {
      query.dueDate = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('assignedBy', 'name email avatar');
    
    const events = tasks.map(task => ({
      id: task._id,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      backgroundColor: getPriorityColor(task.priority),
      borderColor: getPriorityColor(task.priority),
      extendedProps: {
        status: task.status,
        priority: task.priority,
        description: task.description
      }
    }));
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get calendar events error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Helper function to get color based on priority
function getPriorityColor(priority) {
  switch (priority) {
    case 'urgent':
      return '#EF4444'; // Red
    case 'high':
      return '#F59E0B'; // Amber
    case 'medium':
      return '#3B82F6'; // Blue
    case 'low':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
}

module.exports = router;