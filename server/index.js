require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
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

// CORS setup
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200 // Increased limit for development
});

// Socket.io setup
const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iib-chat';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

// Models
const { User, PendingUser, Chat, Message, UserSettings } = require('./models');

// Import middleware functions
const { authenticateToken, requireManager } = require('./middleware/auth');

// Pass io object to routes that need it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const databaseStatus = mongoose.connection.readyState === 1 ? 'mongodb-connected' : 'mongodb-disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: databaseStatus
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/broadcasts', broadcastsRoutes);

// Additional routes that frontend expects
app.get('/api/pending-users', authenticateToken, requireManager, async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pending-users/:id/approve', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pendingUser = await PendingUser.findById(id);
    if (!pendingUser) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: 'employee',
      isApproved: true,
      status: 'offline'
    });

    await newUser.save();
    await PendingUser.findByIdAndDelete(id);

    req.io.emit('user-approved', { userId: newUser._id });

    res.json({ success: true, user: newUser.toJSON() });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.post('/api/pending-users/:id/reject', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await PendingUser.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

app.get('/api/messages/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const message = new Message({
      chatId,
      senderId: req.user.userId,
      senderName: user.name,
      content,
      type,
      replyTo,
      reactions: [],
      readBy: [{
        userId: req.user.userId,
        readAt: new Date()
      }]
    });

    await message.save();

    // Convert to JSON and ensure all fields are present
    const messageData = {
      id: message._id.toString(),
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      replyTo: message.replyTo,
      reactions: message.reactions,
      readBy: message.readBy,
      isDeleted: false
    };

    // Emit to all users in the chat
    req.io.to(chatId).emit('receive-message', messageData);
    
    // Also emit to general room for notifications
    req.io.emit('new-message', {
      chatId,
      message: messageData
    });

    res.json(messageData);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/user-settings', authenticateToken, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.user.userId });
    
    if (!settings) {
      settings = new UserSettings({ userId: req.user.userId });
      await settings.save();
    }
    
    res.json(settings.toJSON());
  } catch (error) {
    console.error('Get user settings error:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  socket.on('join-user', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);
    }
  });
  
  socket.on('join-chat', (chatId) => {
    if (chatId) {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat: ${chatId}`);
    }
  });
  
  socket.on('leave-chat', (chatId) => {
    if (chatId) {
      socket.leave(chatId);
      console.log(`User ${socket.id} left chat: ${chatId}`);
    }
  });
  
  socket.on('typing', ({ chatId, userName }) => {
    socket.to(chatId).emit('user-typing', { chatId, userName });
  });
  
  socket.on('stop-typing', ({ chatId, userName }) => {
    socket.to(chatId).emit('user-stop-typing', { chatId, userName });
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize default data
async function createDefaultAdmin() {
  try {
    const managerCount = await User.countDocuments({ role: 'manager', isApproved: true });
    
    if (managerCount === 0) {
      const hashedPassword = await bcrypt.hash('Admin123', 12);
      
      const admin = new User({
        name: 'Administrator',
        email: 'admin@iibchat.com',
        password: hashedPassword,
        role: 'manager',
        isApproved: true,
        status: 'online',
        avatar: ''
      });
      
      await admin.save();
      console.log('✅ Default admin created (admin@iibchat.com / Admin123)');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
}

async function createDefaultChats() {
  try {
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

async function initializeApp() {
  try {
    await createDefaultAdmin();
    await createDefaultChats();
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectToDatabase();
  await initializeApp();
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
    console.log(`🌐 Backend API available at: http://localhost:${PORT}/api`);
  });
}

startServer();

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
