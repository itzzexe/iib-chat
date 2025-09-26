const express = require('express');
const { Message, Chat } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Search messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { query, limit = 50, page = 1 } = req.query;
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 results
    const skip = (parseInt(page) - 1) * limitNum;

    // Use aggregation pipeline for better performance
    const pipeline = [
      {
        $match: {
          $text: { $search: query.trim() }
        }
      },
      {
        $addFields: {
          score: { $meta: 'textScore' }
        }
      },
      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat'
        }
      },
      {
        $unwind: '$chat'
      },
      {
        $match: {
          'chat.participants': req.user.userId
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sender',
          pipeline: [{ $project: { name: 1, avatar: 1 } }]
        }
      },
      {
        $unwind: '$sender'
      },
      {
        $project: {
          content: 1,
          senderId: 1,
          chatId: 1,
          createdAt: 1,
          score: 1,
          sender: 1,
          chat: {
            _id: '$chat._id',
            name: '$chat.name',
            type: '$chat.type'
          }
        }
      },
      {
        $sort: { score: -1, createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ];

    const results = await Message.aggregate(pipeline);

    res.json({ 
      success: true, 
      data: results,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        hasMore: results.length === limitNum
      }
    });

  } catch (error) {
    logger.error('Search error', { error: error.message, query, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;