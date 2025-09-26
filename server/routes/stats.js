const express = require('express');
const { User, Chat, Message, AuditLog } = require('../models');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { createSampleAuditLogs } = require('../services/auditLogService');
const router = express.Router();

// Get dashboard stats (managers only)
router.get('/dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      onlineUsers,
      totalChats,
      totalMessages,
      messagesLast7Days,
      messagesLast30Days,
      topUsers,
      chatActivity
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'online' }),
      Chat.countDocuments(),
      Message.countDocuments(),
      // Optimized aggregation for 7-day message stats
      Message.aggregate([
        { 
          $match: { 
            createdAt: { $gte: sevenDaysAgo } 
          } 
        },
        { 
          $group: {
            _id: { 
              $dateToString: { 
                format: '%Y-%m-%d', 
                date: '$createdAt',
                timezone: 'UTC'
              } 
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // 30-day message count for trend analysis
      Message.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      // Top users with better performance
      Message.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thirtyDaysAgo } 
          } 
        },
        { 
          $group: { 
            _id: '$senderId', 
            count: { $sum: 1 },
            lastMessage: { $max: '$createdAt' }
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { 
          $lookup: { 
            from: 'users', 
            localField: '_id', 
            foreignField: '_id', 
            as: 'user',
            pipeline: [{ $project: { name: 1, avatar: 1 } }]
          } 
        },
        { $unwind: '$user' },
        { 
          $project: { 
            name: '$user.name',
            avatar: '$user.avatar',
            count: 1,
            lastMessage: 1,
            _id: 0 
          } 
        }
      ]),
      // Chat activity stats
      Chat.aggregate([
        {
          $lookup: {
            from: 'messages',
            localField: '_id',
            foreignField: 'chatId',
            as: 'messages',
            pipeline: [
              { $match: { createdAt: { $gte: sevenDaysAgo } } },
              { $count: 'count' }
            ]
          }
        },
        {
          $addFields: {
            messageCount: { $ifNull: [{ $arrayElemAt: ['$messages.count', 0] }, 0] }
          }
        },
        {
          $match: {
            messageCount: { $gt: 0 }
          }
        },
        {
          $sort: { messageCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $project: {
            name: 1,
            type: 1,
            messageCount: 1,
            participantCount: { $size: '$participants' }
          }
        }
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
        messagesLast30Days,
        topUsers,
        chatActivity,
        trends: {
          userGrowth: totalUsers > 0 ? ((totalUsers / Math.max(totalUsers - 10, 1)) - 1) * 100 : 0,
          messageGrowth: messagesLast30Days > 0 ? ((messagesLast7Days.reduce((sum, day) => sum + day.count, 0) * 4.3 / messagesLast30Days) - 1) * 100 : 0
        }
      },
    });

  } catch (error) {
    logger.error('Get dashboard stats error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get audit logs (managers only)
router.get('/audit-logs', authenticateToken, requireManager, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      action, 
      userId, 
      startDate, 
      endDate 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page

    // Build filter query
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (userId) filter.actorId = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Use aggregation for better performance
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'actorId',
          foreignField: '_id',
          as: 'actor',
          pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }]
        }
      },
      {
        $addFields: {
          actor: { $arrayElemAt: ['$actor', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          logs: [
            { $skip: skip },
            { $limit: limitNum }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      }
    ];

    const [result] = await AuditLog.aggregate(pipeline);
    const logs = result.logs;
    const total = result.totalCount[0]?.count || 0;

    res.json({
      success: true,
      logs: logs,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        totalCount: total,
        totalPages: Math.ceil(total / limitNum),
        hasNext: skip + limitNum < total,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        action,
        userId,
        startDate,
        endDate
      }
    });
  } catch (error) {
    logger.error('Get audit logs error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create sample audit logs (for testing - managers only)
router.post('/create-sample-logs', authenticateToken, requireManager, async (req, res) => {
  try {
    await createSampleAuditLogs(req.user.userId);
    res.json({
      success: true,
      message: 'Sample audit logs created successfully'
    });
  } catch (error) {
    logger.error('Create sample logs error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Clear all audit logs (for testing - managers only)
router.delete('/clear-audit-logs', authenticateToken, requireManager, async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.json({
      success: true,
      message: 'All audit logs cleared successfully'
    });
  } catch (error) {
    logger.error('Clear audit logs error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;