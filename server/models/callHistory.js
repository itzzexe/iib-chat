const mongoose = require('mongoose');

const callHistorySchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  chatId: {
    type: String,
    required: true
  },
  chatName: {
    type: String,
    required: true
  },
  participants: [{
    type: String,
    required: true
  }],
  participantNames: [{
    type: String,
    required: true
  }],
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['completed', 'missed', 'rejected', 'ongoing'],
    default: 'completed'
  },
  initiatedBy: {
    type: String,
    required: true
  },
  initiatedByName: {
    type: String,
    required: true
  },
  isIncoming: {
    type: Boolean,
    default: false
  },
  hasRecording: {
    type: Boolean,
    default: false
  },
  recordingUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
callHistorySchema.index({ initiatedBy: 1, startTime: -1 }); // User call history
callHistorySchema.index({ participants: 1, startTime: -1 }); // Participant call history
callHistorySchema.index({ chatId: 1, startTime: -1 }); // Chat call history
callHistorySchema.index({ status: 1, startTime: -1 }); // Filter by call status
callHistorySchema.index({ callType: 1, startTime: -1 }); // Filter by call type
callHistorySchema.index({ hasRecording: 1, startTime: -1 }); // Filter recorded calls

// Virtual for formatted duration
callHistorySchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Method to get call statistics
callHistorySchema.statics.getStats = async function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { initiatedBy: userId },
          { participants: userId }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        missedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] }
        },
        videoCalls: {
          $sum: { $cond: [{ $eq: ['$callType', 'video'] }, 1, 0] }
        },
        audioCalls: {
          $sum: { $cond: [{ $eq: ['$callType', 'audio'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Method to get recent calls
callHistorySchema.statics.getRecentCalls = async function(userId, limit = 10) {
  return this.find({
    $or: [
      { initiatedBy: userId },
      { participants: userId }
    ]
  })
  .sort({ startTime: -1 })
  .limit(limit);
};

// Method to get calls by date range
callHistorySchema.statics.getCallsByDateRange = async function(userId, startDate, endDate) {
  return this.find({
    $or: [
      { initiatedBy: userId },
      { participants: userId }
    ],
    startTime: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ startTime: -1 });
};

module.exports = mongoose.model('CallHistory', callHistorySchema);