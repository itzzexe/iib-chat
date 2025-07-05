const express = require('express');
const { Chat, Message } = require('../models');
const { authenticateToken, requireManager } = require('../middleware/auth');
const { validateObjectId, validateChat, validateMessage } = require('../middleware/validation');
const { logAction } = require('../services/auditLogService');

const router = express.Router();

// --- MANAGER-ONLY ROUTES (MOVE TO TOP) ---

// Get all direct chats for oversight
router.get('/oversee/direct', authenticateToken, requireManager, async (req, res) => {
  try {
    const directChats = await Chat.find({ type: 'direct' })
      .sort({ updatedAt: -1 })
      .populate('participants', 'name avatar email');
      
    res.json({
      success: true,
      data: directChats
    });
  } catch (error) {
    console.error('Oversee direct chats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get messages for any chat by ID (for manager oversight)
router.get('/oversee/:id/messages', authenticateToken, requireManager, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const chat = await Chat.findById(id);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find({ chatId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar');
      
    messages.reverse(); // chronological order
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Oversee messages error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Clear chat messages (managers only) - SPECIFIC ROUTE FIRST
router.delete('/:chatId/messages', authenticateToken, requireManager, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log('Clear chat messages request:', { chatId, userId: req.user.userId });
    
    // Validate chatId format
    if (!chatId || chatId.length !== 24) {
      console.log('Invalid chatId format:', chatId);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid chat ID format' 
      });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('Chat not found for clearing:', chatId);
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found' 
      });
    }
    
    console.log('Chat found for clearing:', { chatId, chatType: chat.type, chatName: chat.name });
    
    // Delete all messages in the chat
    const result = await Message.deleteMany({ chatId });
    console.log('Messages cleared:', result.deletedCount);
    
    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: null,
      updatedAt: new Date()
    });
    
    // Log the action
    try {
      await logAction(req.user.userId, 'chat.cleared', chatId, {
        chatName: chat.name,
        messagesDeleted: result.deletedCount
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    // Notify all users via socket
    req.io.to(chatId).emit('chat-cleared', { 
      chatId, 
      clearedBy: req.user.userId,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      message: `Chat cleared successfully. ${result.deletedCount} messages deleted.`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear chat' 
    });
  }
});

// Delete chat (managers only) - SPECIFIC ROUTE SECOND
router.delete('/:chatId', authenticateToken, requireManager, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    console.log('Delete chat request:', { chatId, userId: req.user.userId });
    
    // Validate chatId format
    if (!chatId || chatId.length !== 24) {
      console.log('Invalid chatId format:', chatId);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid chat ID format' 
      });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('Chat not found:', chatId);
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found' 
      });
    }
    
    console.log('Chat found:', { chatId, chatType: chat.type, chatName: chat.name });
    
    // Prevent deletion of system chats (general, announcements)
    if (chat.type === 'general' || chat.type === 'announcements') {
      console.log('Attempted to delete system chat:', chat.type);
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete system chats' 
      });
    }
    
    // Delete all messages in the chat
    const deleteResult = await Message.deleteMany({ chatId });
    console.log('Messages deleted:', deleteResult.deletedCount);
    
    // Delete the chat
    await Chat.findByIdAndDelete(chatId);
    console.log('Chat deleted successfully');
    
    // Log the action
    try {
      await logAction(req.user.userId, 'chat.deleted', chatId, {
        chatName: chat.name,
        chatType: chat.type,
        participantCount: chat.participants.length
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    // Notify all users via socket
    req.io.emit('chat-deleted', { chatId, deletedBy: req.user.userId });
    
    res.json({ 
      success: true, 
      message: 'Chat deleted successfully' 
    });
    
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete chat' 
    });
  }
});

// Get user's chats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.userId,
      isArchived: { $ne: true }
    })
    .sort({ updatedAt: -1 })
    .populate('participants', 'name avatar status');
    
    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get chat by ID
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    // Check if user is participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Create new chat
router.post('/', authenticateToken, validateChat, async (req, res) => {
  try {
    const chatData = {
      ...req.body,
      participants: [...new Set([...req.body.participants, req.user.userId])] // Remove duplicates and ensure current user is included
    };
    
    const chat = new Chat(chatData);
    await chat.save();
    
    await logAction(req.user.userId, 'chat.created', chat._id);

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: chat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update chat
router.put('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    // Check if user is participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Only allow certain fields to be updated
    const allowedUpdates = ['name', 'unreadCount'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { ...filteredUpdates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Chat updated successfully',
      data: updatedChat
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Archive chat
router.patch('/:id/archive', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    // Check if user is participant
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    chat.isArchived = !chat.isArchived;
    await chat.save();
    
    res.json({
      success: true,
      message: `Chat ${chat.isArchived ? 'archived' : 'unarchived'} successfully`,
      data: chat
    });
  } catch (error) {
    console.error('Archive chat error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Get chat messages
router.get('/:id/messages', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if user has access to this chat
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        error: 'Chat not found' 
      });
    }
    
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find({ chatId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name avatar');
    
    // Reverse to get chronological order
    messages.reverse();
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Send message
router.post('/:id/messages', authenticateToken, validateObjectId(), validateMessage, async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const { content, type, isUrgent, replyTo } = req.body;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    if (!chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const messageData = {
      chatId,
      senderId: req.user.userId,
      senderName: req.user.name,
      content,
      type,
      isUrgent,
      replyTo: replyTo || null,
    };

    if (replyTo) {
      const originalMessage = await Message.findById(replyTo);
      if (originalMessage) {
        messageData.replyToContent = originalMessage.content.substring(0, 100);
        messageData.replyToSender = originalMessage.senderName;
      }
    }
    
    const message = new Message(messageData);
    await message.save();
    
    chat.lastMessage = {
      content: message.content,
      senderId: message.senderId,
      timestamp: message.createdAt
    };
    chat.updatedAt = new Date();
    await chat.save();
    
    await message.populate('senderId', 'name avatar');
    
    req.io.to(chatId).emit('receive-message', message);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Update message (reactions, edit content, etc.)
router.put('/:chatId/messages/:messageId', authenticateToken, validateObjectId('chatId'), validateObjectId('messageId'), async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { content, emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    if (message.chatId.toString() !== chatId) {
      return res.status(400).json({ success: false, error: 'Message does not belong to this chat' });
    }

    let updated = false;

    // Handle content editing
    if (content) {
      if (message.senderId.toString() !== req.user.userId) {
        return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
      }
      message.content = content;
      message.editedAt = new Date();
      updated = true;
    }

    // Handle reaction toggling
    if (emoji) {
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(req.user.userId)) {
        return res.status(403).json({ success: false, error: 'Access denied to this chat' });
      }

      const existingReactionIndex = message.reactions.findIndex(
        r => r.userId.toString() === req.user.userId && r.emoji === emoji
      );
      
      if (existingReactionIndex >= 0) {
        message.reactions.splice(existingReactionIndex, 1); // Remove reaction
      } else {
        message.reactions.push({
          emoji,
          userId: req.user.userId,
          userName: req.user.name || 'Unknown User'
        }); // Add reaction
      }
      updated = true;
    }

    if (updated) {
      await message.save();
      req.io.to(chatId).emit('messageUpdated', message); // Notify clients
      res.json({ success: true, message: 'Message updated successfully', data: message });
    } else {
      res.status(400).json({ success: false, error: 'No update action specified (e.g., content or emoji)' });
    }

  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete a message (soft delete)
router.delete('/:chatId/messages/:messageId', authenticateToken, validateObjectId('chatId'), validateObjectId('messageId'), async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    if (message.chatId.toString() !== chatId) {
      return res.status(400).json({ success: false, error: 'Message does not belong to this chat' });
    }
    if (message.senderId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted.'; // Overwrite content
    await message.save();

    // Emit socket event to update clients in real-time
    req.io.to(chatId).emit('messageDeleted', { messageId, chatId });

    res.json({ success: true, message: 'Message deleted', data: { messageId, chatId } });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Mark messages as read
router.post('/:chatId/messages/read', authenticateToken, validateObjectId('chatId'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Message IDs must be a non-empty array.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user.userId)) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    await Message.updateMany(
      { _id: { $in: messageIds }, chatId: chatId },
      { $addToSet: { readBy: { userId: req.user.userId, readAt: new Date() } } }
    );

    // Notify other users in the chat that messages have been read
    const recipientIds = chat.participants.filter(p => p.toString() !== req.user.userId);
    recipientIds.forEach(recipientId => {
      req.io.to(recipientId).emit('messagesRead', {
        chatId,
        readerId: req.user.userId,
        messageIds,
      });
    });

    res.json({ success: true, message: 'Messages marked as read.' });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router; 