const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  assignmentType: {
    type: String,
    enum: ['individual', 'team'],
    default: 'individual'
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ teamId: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ status: 1, priority: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return this.dueDate < new Date();
});

// Virtual for task duration
taskSchema.virtual('duration').get(function() {
  if (this.completedDate && this.startDate) {
    return this.completedDate - this.startDate;
  }
  return null;
});

// Pre-save middleware to update completedDate
taskSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

// Static method to get tasks by user
taskSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { assignedTo: userId },
      { assignedBy: userId }
    ],
    isActive: true
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.teamId) {
    query.teamId = options.teamId;
  }

  return this.find(query)
    .populate('assignedTo', 'name email avatar')
    .populate('assignedBy', 'name email avatar')
    .sort({ dueDate: 1, priority: -1, createdAt: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.findOverdue = function() {
  return this.find({
    status: { $ne: 'completed' },
    dueDate: { $lt: new Date() },
    isActive: true
  }).populate('assignedTo', 'name email avatar');
};

// Instance method to add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    userId,
    content,
    createdAt: new Date()
  });
  return this.save();
};

// Instance method to update progress
taskSchema.methods.updateProgress = function(progress) {
  this.progress = Math.max(0, Math.min(100, progress));
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedDate = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Task', taskSchema); 