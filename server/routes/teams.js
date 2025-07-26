const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const { authenticateToken } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

// Get all teams for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { 'members.userId': req.user.userId },
        { createdBy: req.user.userId }
      ],
      isActive: true
    }).populate('members.userId', 'name email avatar');
    
    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get team by ID
router.get('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Check if user is member of this team
    const isMember = team.members.some(member => member.userId === req.user.userId);
    const isCreator = team.createdBy === req.user.userId;
    
    if (!isMember && !isCreator && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Create new team
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, members, color } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Team name is required'
      });
    }
    
    // Check if team name already exists
    const existingTeam = await Team.findOne({ 
      name: name.trim(),
      isActive: true 
    });
    
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        error: 'Team name already exists'
      });
    }
    
    const team = new Team({
      name: name.trim(),
      description: description || '',
      createdBy: req.user.userId,
      color: color || '#3B82F6',
      members: [
        {
          userId: req.user.userId,
          role: 'admin'
        },
        ...(members || []).map(memberId => ({
          userId: memberId,
          role: 'member'
        }))
      ]
    });
    
    await team.save();
    
    const populatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.status(201).json({
      success: true,
      data: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update team
router.put('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Check if user can update this team
    const isAdmin = team.members.find(member => 
      member.userId === req.user.userId && member.role === 'admin'
    );
    const isCreator = team.createdBy === req.user.userId;
    
    if (!isAdmin && !isCreator && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const { name, description, color } = req.body;
    
    if (name !== undefined) team.name = name.trim();
    if (description !== undefined) team.description = description;
    if (color !== undefined) team.color = color;
    
    await team.save();
    
    const updatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Add member to team
router.post('/:id/members', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Check if user can add members
    const isAdmin = team.members.find(member => 
      member.userId === req.user.userId && member.role === 'admin'
    );
    const isCreator = team.createdBy === req.user.userId;
    
    if (!isAdmin && !isCreator && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Check if user is already a member
    const isAlreadyMember = team.members.some(member => member.userId === userId);
    
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this team'
      });
    }
    
    team.members.push({
      userId,
      role
    });
    
    await team.save();
    
    const updatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Check if user can remove members
    const isAdmin = team.members.find(member => 
      member.userId === req.user.userId && member.role === 'admin'
    );
    const isCreator = team.createdBy === req.user.userId;
    
    if (!isAdmin && !isCreator && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Cannot remove team creator
    if (userId === team.createdBy) {
      return res.status(400).json({
        success: false,
        error: 'Cannot remove team creator'
      });
    }
    
    team.members = team.members.filter(member => member.userId !== userId);
    
    await team.save();
    
    const updatedTeam = await Team.findById(team._id)
      .populate('members.userId', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete team
router.delete('/:id', authenticateToken, validateObjectId(), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    // Only team creator or manager can delete
    if (team.createdBy !== req.user.userId && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    // Soft delete - set isActive to false
    team.isActive = false;
    await team.save();
    
    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 