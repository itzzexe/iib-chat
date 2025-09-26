const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Chat name cannot exceed 100 characters']
  },
  type: { 
    type: String, 
    enum: ['direct', 'group', 'general', 'announcements'], 
    required: [true, 'Chat type is required']
  },
  participants: [{
    type: String,
    required: true
  }],
  lastMessage: {
    content: {
      type: String,
      maxlength: [1000, 'Message content cannot exceed 1000 characters']
    },
    senderId: String,
    senderName: String,
    timestamp: Date
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdBy: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  unreadCount: {
    type: Number,
    default: 0,
    min: 0
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

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, isArchived: 1 }); // Compound index for filtering
chatSchema.index({ updatedAt: -1 }); // For sorting by recent activity
chatSchema.index({ 'lastMessage.timestamp': -1 }); // For sorting by last message

// Validate participants array
chatSchema.pre('save', function(next) {
  // General and announcements chats don't need specific participants
  if (this.type === 'general' || this.type === 'announcements') {
    next();
    return;
  }
  
  if (this.participants.length === 0) {
    next(new Error('Chat must have at least one participant'));
  }
  
  if (this.type === 'direct' && this.participants.length !== 2) {
    next(new Error('Direct chat must have exactly 2 participants'));
  }
  
  next();
});

module.exports = mongoose.model('Chat', chatSchema);