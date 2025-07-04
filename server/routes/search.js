const express = require('express');
const { Message, Chat } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Search messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    // Find chats the user is a participant in
    const userChats = await Chat.find({ participants: req.user.userId }).select('_id');
    const userChatIds = userChats.map(chat => chat._id);

    // Perform text search on messages within the user's chats
    const results = await Message.find(
      { 
        $text: { $search: query },
        chatId: { $in: userChatIds }
      },
      { 
        score: { $meta: 'textScore' } // Add relevance score
      }
    )
    .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
    .limit(50) // Limit results
    .populate('senderId', 'name avatar')
    .populate('chatId', 'name type participants');

    res.json({ success: true, data: results });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router; 