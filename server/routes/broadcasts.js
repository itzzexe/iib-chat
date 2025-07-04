const express = require('express');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { logAction } = require('../services/auditLogService');
const router = express.Router();

router.post('/send', authenticateToken, requireManager, (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  try {
    // Emit a global broadcast event to all connected clients
    req.io.emit('global-broadcast', {
      senderName: req.user.name,
      message: message,
      timestamp: new Date(),
    });

    // Log the action
    logAction(req.user.userId, 'broadcast.sent', 'all_users', { message });

    res.json({ success: true, message: 'Broadcast sent successfully' });

  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ success: false, error: 'Failed to send broadcast' });
  }
});

module.exports = router; 