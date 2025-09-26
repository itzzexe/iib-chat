const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Hide password by default
  },
  role: { 
    type: String, 
    enum: ['manager', 'employee'], 
    default: 'employee' 
  },
  avatar: {
    type: String,
    default: ''
  },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'away', 'busy'], 
    default: 'offline' 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  registeredAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Always remove password from JSON output
      return ret;
    }
  }
});

// Indexes for faster queries
// Note: email index is automatically created by unique: true
userSchema.index({ status: 1 });
userSchema.index({ role: 1, isApproved: 1 });
// Index for activity sorting
userSchema.index({ lastSeen: -1 }); // For sorting by activity

module.exports = mongoose.model('User', userSchema);