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
    console.error(`Failed to log audit action: ${action}`, error);
  }
};

module.exports = {
  logAction,
}; 