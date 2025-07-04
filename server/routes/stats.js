const express = require('express');
const { User, Chat, Message, AuditLog } = require('../models');
const { authenticateToken, requireManager } = require('../middleware/auth');
const router = express.Router();

// Get dashboard stats (managers only)
router.get('/dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      onlineUsers,
      totalChats,
      totalMessages,
      messagesLast7Days,
      topUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'online' }),
      Chat.countDocuments(),
      Message.countDocuments(),
      Message.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Message.aggregate([
        { $group: { _id: '$senderId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', count: 1, _id: 0 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        onlineUsers,
        totalChats,
        totalMessages,
        messagesLast7Days,
        topUsers,
      },
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get audit logs (managers only)
router.get('/audit-logs', authenticateToken, requireManager, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('actorId', 'name email');
      
    const total = await AuditLog.countDocuments();

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router; 