const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Team = require('../models/Team');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

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
    console.error('Get tasks error:', error);
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
    console.error('Get task error:', error);
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
    
    // Check if assigned user exists and is approved
    console.log('Looking for user with ID:', assignedTo);
    console.log('User ID type:', typeof assignedTo);
    console.log('User ID length:', assignedTo?.length);
    
    let assignedUser;
    try {
      assignedUser = await require('../models/User').findOne({ 
        _id: assignedTo, 
        isApproved: true 
      });
    } catch (error) {
      console.log('Error finding user:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        details: `User ID: ${assignedTo}, Error: ${error.message}`
      });
    }
    
    console.log('Found user:', assignedUser ? 'Yes' : 'No');
    
    if (!assignedUser) {
      // Try to find the user without the isApproved filter to see if it exists
      const userExists = await require('../models/User').findOne({ _id: assignedTo });
      if (!userExists) {
        return res.status(400).json({
          success: false,
          error: 'Assigned user not found',
          details: `User ID: ${assignedTo} does not exist`
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Assigned user not approved',
          details: `User ID: ${assignedTo} exists but is not approved`
        });
      }
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
    
    // Emit task created event to all connected users
    if (req.io) {
      console.log('📋 Emitting task:created event to all users');
      req.io.emit('task:created', {
        task: populatedTask,
        createdBy: req.user.userId
      });
      
      // Also emit to specific assigned user if different from creator
      if (assignedTo !== req.user.userId) {
        console.log(`📋 Emitting task:assigned event to user:${assignedTo}`);
        req.io.to(`user:${assignedTo}`).emit('task:assigned', {
          task: populatedTask,
          assignedBy: req.user.userId
        });
      }
      
      console.log('📋 Task created event emitted:', {
        taskId: populatedTask.id,
        assignedTo: assignedTo,
        createdBy: req.user.userId,
        taskTitle: populatedTask.title
      });
    } else {
      console.log('❌ req.io is not available');
    }
    
    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error('Create task error:', error);
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
    
    // Emit task updated event to all connected users
    if (req.io) {
      req.io.emit('task:updated', {
        task: updatedTask,
        updatedBy: req.user.userId
      });
    }
    
    res.json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    console.error('Update task error:', error);
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
    
    // Emit task deleted event to all connected users
    if (req.io) {
      req.io.emit('task:deleted', {
        taskId: req.params.id,
        deletedBy: req.user.userId
      });
    }
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
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
    console.error('Add comment error:', error);
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
    console.error('Get calendar events error:', error);
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