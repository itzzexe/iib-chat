const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user.login',
      'user.role.updated',
      'user.deleted',
      'user.approved',
      'user.rejected',
      'chat.created',
      'chat.deleted',
      'chat.cleared',
      'broadcast.sent',
      'message.sent',
      'message.deleted'
    ],
  },
  targetId: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

auditLogSchema.index({ actorId: 1, createdAt: -1 }); // User activity history
auditLogSchema.index({ action: 1, createdAt: -1 }); // Action-based queries
auditLogSchema.index({ targetId: 1, action: 1 }); // Target-specific audit trail
auditLogSchema.index({ createdAt: -1 }); // Time-based queries

module.exports = mongoose.model('AuditLog', auditLogSchema);