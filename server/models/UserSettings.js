const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: [true, 'User ID is required'],
    unique: true
  },
  theme: { 
    type: String, 
    enum: ['light', 'dark', 'auto'], 
    default: 'auto' 
  },
  language: { 
    type: String, 
    enum: ['en', 'ar'], 
    default: 'en' 
  },
  notifications: { 
    type: Boolean, 
    default: true 
  },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'away', 'busy'], 
    default: 'online' 
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  soundNotifications: {
    type: Boolean,
    default: true
  },
  messagePreview: {
    type: Boolean,
    default: true
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

// Index already created by unique: true

module.exports = mongoose.model('UserSettings', userSettingsSchema); 