const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Team description cannot exceed 500 characters']
  },
  members: [{
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['member', 'lead', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: String,
    required: [true, 'Team creator is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ createdBy: 1 });
teamSchema.index({ isActive: 1 });

module.exports = mongoose.model('Team', teamSchema); 