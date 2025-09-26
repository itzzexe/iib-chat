const AuditLog = require('../models/AuditLog');

const logAction = async (actorId, action, targetId, details = {}) => {
  try {
    const log = new AuditLog({
      actorId,
      action,
      targetId,
      details,
    });
    await log.save();
  } catch (error) {
    logger.error('Failed to log audit action', { error: error.message, actorId, action, targetId });
  }
};

// Create sample audit logs for testing
const createSampleAuditLogs = async (userId) => {
  try {
    const sampleActions = [
      {
        action: 'user.login',
        targetId: userId,
        details: { ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0' }
      },
      {
        action: 'chat.created',
        targetId: 'sample-chat-1',
        details: { chatName: 'Project Discussion', chatType: 'group', participantCount: 5 }
      },
      {
        action: 'message.sent',
        targetId: 'sample-message-1',
        details: { chatId: 'sample-chat-1', messageLength: 45, hasAttachments: false }
      },
      {
        action: 'user.role.updated',
        targetId: 'user-123',
        details: { previousRole: 'employee', newRole: 'manager', updatedBy: userId }
      },
      {
        action: 'broadcast.sent',
        targetId: 'all_users',
        details: { messageLength: 120, recipients: 25 }
      },
      {
        action: 'chat.deleted',
        targetId: 'sample-chat-2',
        details: { chatName: 'Sample Project', deletedMessages: 150 }
      },
      {
        action: 'message.deleted',
        targetId: 'sample-message-2',
        details: { chatId: 'sample-chat-1', reason: 'inappropriate content' }
      },
      {
        action: 'user.approved',
        targetId: 'new-user-1',
        details: { approvedBy: userId, approvalTime: new Date() }
      },
      {
        action: 'chat.cleared',
        targetId: 'sample-chat-3',
        details: { chatName: 'Test Chat', messagesDeleted: 75 }
      },
      {
        action: 'user.rejected',
        targetId: 'new-user-2',
        details: { rejectedBy: userId, reason: 'invalid email' }
      }
    ];

    // Create logs with different timestamps (last 7 days)
    for (let i = 0; i < sampleActions.length; i++) {
      const action = sampleActions[i];
      const timestamp = new Date(Date.now() - (i * 24 * 60 * 60 * 1000)); // Each log 1 day apart
      
      const log = new AuditLog({
        actorId: userId,
        action: action.action,
        targetId: action.targetId,
        details: action.details,
        createdAt: timestamp
      });
      
      await log.save();
    }
    
    logger.info('Sample audit logs created successfully');
  } catch (error) {
    logger.error('Failed to create sample audit logs', { error: error.message });
  }
};

module.exports = {
  logAction,
  createSampleAuditLogs,
};