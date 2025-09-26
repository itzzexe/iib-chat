const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Validate ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`
      });
    }
    next();
  };
};

// Registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be at least 6 characters'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'file', 'announcement'])
    .withMessage('Invalid message type'),
  
  handleValidationErrors
];

// Chat validation
const validateChat = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Chat name cannot exceed 100 characters'),
  
  body('type')
    .isIn(['direct', 'group', 'announcement'])
    .withMessage('Invalid chat type'),
  
  body('participants')
    .isArray({ min: 1 })
    .withMessage('Chat must have at least one participant'),
  
  handleValidationErrors
];

// User settings validation
const validateUserSettings = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme'),
  
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Invalid language'),
  
  body('notifications')
    .optional()
    .isBoolean()
    .withMessage('Notifications must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

// Task validation
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('status')
    .optional()
    .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Invalid due date format'),
  
  body('assignedTo')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid user ID');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Team validation
const validateTeam = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateRegistration,
  validateLogin,
  validateMessage,
  validateChat,
  validateUserSettings,
  validateTask,
  validateTeam
};