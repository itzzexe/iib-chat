require('dotenv').config(); // Load environment variables at the very top

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Import all routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const chatsRoutes = require('./routes/chats');
const uploadRoutes = require('./routes/upload');
const utilsRoutes = require('./routes/utils');
const searchRoutes = require('./routes/search');
const statsRoutes = require('./routes/stats');
const broadcastsRoutes = require('./routes/broadcasts');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// More robust CORS setup
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
};

// Use CORS options for all routes
app.use(cors(corsOptions));

// Explicitly handle pre-flight requests
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // Increased limit
});
// app.use('/api/', limiter);

// Socket.io setup
const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-2024';

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iibchat';

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  initializeApp();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Models
const { User, PendingUser, Chat, Message, UserSettings } = require('./models');

// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Pass io object to routes that need it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- API Routes ---
// The order is important here. More specific routes should come first.
app.use('/api/auth', authRoutes); // Moved from the generic '/api' to be more specific
app.use('/api/users', usersRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/broadcasts', broadcastsRoutes);

// ==================== HEALTH CHECK ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== SOCKET.IO LOGIC ====================
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  // Join user to their personal room
  socket.on('join-user', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    }
  });
  
  // Join chat room
  socket.on('join-chat', (chatId) => {
    if (chatId) {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    }
  });
  
  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    if (chatId) {
      socket.leave(chatId);
      console.log(`User ${socket.id} left chat: ${chatId}`);
    }
  });
  
  // Handle typing
  socket.on('typing', ({ chatId, userName }) => {
    socket.to(chatId).emit('user-typing', { chatId, userName });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== INITIALIZATION ====================

async function initializeApp() {
  try {
    // Create default chats if they don't exist
    await createDefaultChats();
    
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
}

async function createDefaultChats() {
  try {
    // Create General Chat
    const generalChatExists = await Chat.findOne({ type: 'general' });
    if (!generalChatExists) {
      const generalChat = new Chat({
        name: 'General Chat',
        type: 'general',
        participants: [],
        description: 'General discussion for all team members'
      });
      await generalChat.save();
      console.log('✅ General chat created');
    }
    
    // Create Announcements Chat
    const announcementsChatExists = await Chat.findOne({ type: 'announcements' });
    if (!announcementsChatExists) {
      const announcementsChat = new Chat({
        name: 'Announcements',
        type: 'announcements',
        participants: [],
        description: 'Important announcements from management'
      });
      await announcementsChat.save();
      console.log('✅ Announcements chat created');
    }
  } catch (error) {
    console.error('Error creating default chats:', error);
  }
}

// ==================== SERVER START ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`🌐 Backend API available at: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = { app, server, io };
