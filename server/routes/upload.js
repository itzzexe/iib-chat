const express = require('express');
const path = require('path');
const fs = require('fs');
const { uploadFile, uploadAvatar, handleUploadError } = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { uploadRateLimit } = require('../middleware/security');
const logger = require('../utils/logger');
const router = express.Router();

// All upload routes require authentication
router.use(authenticateToken);
router.use(uploadRateLimit);

// Upload single file with enhanced security
router.post('/single', uploadFile.single('file'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    logger.info('File uploaded successfully', {
      userId: req.user.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    logger.error('Upload error', { 
      error: error.message, 
      userId: req.user?.userId 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed' 
    });
  }
});

// Upload multiple files with enhanced security
router.post('/multiple', uploadFile.array('files', 5), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No files uploaded' 
      });
    }

    const filesInfo = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    logger.info('Multiple files uploaded successfully', {
      userId: req.user.userId,
      fileCount: req.files.length,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0),
      files: filesInfo.map(f => ({ name: f.originalName, size: f.size }))
    });

    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: filesInfo
    });
  } catch (error) {
    logger.error('Multiple upload error', { 
      error: error.message, 
      userId: req.user?.userId 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed' 
    });
  }
});

// Upload avatar with enhanced security
router.post('/avatar', uploadAvatar.single('avatar'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No avatar file uploaded' 
      });
    }

    const avatarInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/avatars/${req.file.filename}`
    };

    logger.info('Avatar uploaded successfully', {
      userId: req.user.userId,
      filename: req.file.filename,
      size: req.file.size
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar: avatarInfo
    });
  } catch (error) {
    logger.error('Avatar upload error', { 
      error: error.message, 
      userId: req.user?.userId 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Avatar upload failed' 
    });
  }
});

// Delete file with security checks
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      logger.warn('Directory traversal attempt', { 
        filename, 
        userId: req.user.userId,
        ip: req.ip 
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid filename' 
      });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    // Ensure the file is within the uploads directory
    const resolvedPath = path.resolve(filePath);
    const uploadsPath = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(uploadsPath)) {
      logger.warn('Path traversal attempt', { 
        filename, 
        resolvedPath,
        userId: req.user.userId,
        ip: req.ip 
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file path' 
      });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      logger.info('File deleted successfully', {
        filename,
        userId: req.user.userId
      });
      
      res.json({ 
        success: true, 
        message: 'File deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }
  } catch (error) {
    logger.error('Delete error', { 
      error: error.message, 
      filename: req.params.filename,
      userId: req.user?.userId 
    });
    res.status(500).json({ 
      success: false, 
      error: 'Delete failed' 
    });
  }
});

module.exports = router;