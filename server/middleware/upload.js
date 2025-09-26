const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Ensure the avatars subdirectory exists
const avatarsDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir);
}

// Multer storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    try {
      // Generate cryptographically secure random filename
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Sanitize and create secure filename
      const filename = `avatar-${req.user.userId}-${timestamp}-${randomBytes}${ext}`;
      
      logger.info('Avatar upload', { 
        userId: req.user.userId, 
        originalName: file.originalname,
        newFilename: filename,
        size: file.size 
      });
      
      cb(null, filename);
    } catch (error) {
      logger.error('Filename generation error', { error: error.message });
      cb(error, null);
    }
  }
});

// Allowed file types with their MIME types and extensions
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};

const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

// Dangerous file extensions to block
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1', '.py', '.rb', '.pl'
];

// File filter for images with enhanced security
const imageFileFilter = (req, file, cb) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    
    // Check if extension is blocked
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      logger.warn('Blocked file extension attempted', { 
        filename: file.originalname, 
        extension: ext,
        userId: req.user?.userId 
      });
      return cb(new Error('File type not allowed for security reasons'), false);
    }
    
    // Check if it's an allowed image type
    if (ALLOWED_IMAGE_TYPES[mimetype] && ALLOWED_IMAGE_TYPES[mimetype].includes(ext)) {
      cb(null, true);
    } else {
      logger.warn('Invalid image file attempted', { 
        filename: file.originalname, 
        mimetype, 
        extension: ext,
        userId: req.user?.userId 
      });
      cb(new Error('Invalid image format. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
    }
  } catch (error) {
    logger.error('File filter error', { error: error.message });
    cb(new Error('File validation failed'), false);
  }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype.toLowerCase();
    
    // Check if extension is blocked
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      logger.warn('Blocked file extension attempted', { 
        filename: file.originalname, 
        extension: ext,
        userId: req.user?.userId 
      });
      return cb(new Error('File type not allowed for security reasons'), false);
    }
    
    // Check if it's an allowed document type
    const allAllowedTypes = { ...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES };
    if (allAllowedTypes[mimetype] && allAllowedTypes[mimetype].includes(ext)) {
      cb(null, true);
    } else {
      logger.warn('Invalid document file attempted', { 
        filename: file.originalname, 
        mimetype, 
        extension: ext,
        userId: req.user?.userId 
      });
      cb(new Error('File type not allowed. Please check allowed file types.'), false);
    }
  } catch (error) {
    logger.error('Document filter error', { error: error.message });
    cb(new Error('File validation failed'), false);
  }
};

// General file storage configuration
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    try {
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      
      const filename = `file-${timestamp}-${randomBytes}${ext}`;
      
      logger.info('File upload', { 
        userId: req.user?.userId, 
        originalName: file.originalname,
        newFilename: filename,
        size: file.size 
      });
      
      cb(null, filename);
    } catch (error) {
      logger.error('Filename generation error', { error: error.message });
      cb(error, null);
    }
  }
});

// Upload configurations with different limits and filters
const uploadAvatar = multer({ 
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5 MB limit
    files: 1 // Only one file at a time
  }
});

const uploadFile = multer({
  storage: generalStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10 MB default
    files: 5 // Maximum 5 files at once
  }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.warn('Multer upload error', { 
      error: error.message, 
      code: error.code,
      userId: req.user?.userId 
    });
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({ 
          success: false, 
          error: 'File too large. Maximum size allowed is 10MB.' 
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({ 
          success: false, 
          error: 'Too many files. Maximum 5 files allowed.' 
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({ 
          success: false, 
          error: 'Unexpected file field.' 
        });
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'File upload error.' 
        });
    }
  }
  
  if (error) {
    logger.error('Upload error', { error: error.message, userId: req.user?.userId });
    return res.status(400).json({ 
      success: false, 
      error: error.message || 'File upload failed.' 
    });
  }
  
  next();
};

module.exports = { 
  uploadAvatar, 
  uploadFile, 
  handleUploadError,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES 
};