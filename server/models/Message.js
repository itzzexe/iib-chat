const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { 
    type: String, 
    required: [true, 'Chat ID is required'],
    index: true
  },
  senderId: { 
    type: String, 
    required: [true, 'Sender ID is required'],
    index: true
  },
  senderName: {
    type: String,
    required: [true, 'Sender name is required'],
    maxlength: [50, 'Sender name cannot exceed 50 characters']
  },
  content: { 
    type: String, 
    required: [true, 'Message content is required'],
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  type: { 
    type: String, 
    enum: ['text', 'file', 'announcement', 'general'], 
    default: 'text' 
  },
  fileUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return this.type !== 'file' || v;
      },
      message: 'File URL is required for file messages'
    }
  },
  fileName: String,
  fileType: String,
  isUrgent: { 
    type: Boolean, 
    default: false 
  },
  reactions: [{
    emoji: {
      type: String,
      required: true,
      maxlength: [10, 'Emoji cannot exceed 10 characters']
    },
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true,
      maxlength: [50, 'User name cannot exceed 50 characters']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  replyToContent: {
    type: String,
    default: null
  },
  replyToSender: {
    type: String,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    userId: String,
    readAt: { type: Date, default: Date.now }
  }],
  fileSize: Number
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      ret.timestamp = ret.createdAt;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ type: 1 });
messageSchema.index({ content: 'text' });

// Virtual for timestamp compatibility
messageSchema.virtual('timestamp').get(function() {
  return this.createdAt;
});

// Ensure virtuals are included in JSON
messageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Message', messageSchema); 