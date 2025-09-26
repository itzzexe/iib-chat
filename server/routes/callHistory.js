const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const CallHistory = require('../models/callHistory');

// Get call history for the authenticated user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get calls where user is a participant
    const callHistory = await CallHistory.find({
      $or: [
        { initiatedBy: userId },
        { participants: userId }
      ]
    })
    .sort({ startTime: -1 })
    .limit(100); // Limit to last 100 calls
    
    res.json(callHistory);
  } catch (error) {
    logger.error('Get call history error', { error: error.message, requesterId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Save a new call record
router.post('/history', authenticateToken, async (req, res) => {
  try {
    const {
      callId,
      chatId,
      chatName,
      participants,
      participantNames,
      callType,
      startTime,
      endTime,
      duration,
      status,
      initiatedBy,
      initiatedByName,
      isIncoming,
      hasRecording,
      recordingUrl
    } = req.body;

    // Check if call record already exists
    const existingCall = await CallHistory.findOne({ callId });
    if (existingCall) {
      logger.info('Call record already exists', { callId, requesterId: req.user.id });
      return res.status(200).json(existingCall);
    }

    const callRecord = new CallHistory({
      callId,
      chatId,
      chatName,
      participants,
      participantNames,
      callType,
      startTime,
      endTime,
      duration,
      status,
      initiatedBy,
      initiatedByName,
      isIncoming,
      hasRecording,
      recordingUrl
    });

    await callRecord.save();
    res.status(201).json(callRecord);
  } catch (error) {
    logger.error('Save call record error', { error: error.message, requesterId: req.user.id });
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      logger.warn('Duplicate call ID detected', { callId: error.keyValue?.callId, requesterId: req.user.id });
      return res.status(409).json({ 
        error: 'Call record already exists',
        callId: error.keyValue?.callId 
      });
    }
    
    res.status(500).json({ error: 'Failed to save call record' });
  }
});

// Delete a call record
router.delete('/history/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const callRecord = await CallHistory.findById(id);
    if (!callRecord) {
      return res.status(404).json({ error: 'Call record not found' });
    }
    
    // Only allow deletion if user is the initiator or a participant
    if (callRecord.initiatedBy !== userId && !callRecord.participants.includes(userId)) {
      return res.status(403).json({ error: 'Not authorized to delete this call record' });
    }
    
    await CallHistory.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete call record error', { error: error.message, callId: req.params.id, requesterId: req.user.id });
    res.status(500).json({ error: 'Failed to delete call record' });
  }
});

// Get call statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await CallHistory.aggregate([
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
    
    const result = stats[0] || {
      totalCalls: 0,
      totalDuration: 0,
      completedCalls: 0,
      missedCalls: 0,
      videoCalls: 0,
      audioCalls: 0
    };
    
    res.json(result);
  } catch (error) {
    logger.error('Get call stats error', { error: error.message, requesterId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch call statistics' });
  }
});

module.exports = router;