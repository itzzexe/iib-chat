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
const logger = require('./utils/logger');
const { 
  securityHeaders, 
  apiRateLimit, 
  sanitizeInput, 
  ipFilter, 
  requestLogger, 
  securityAudit, 
  helmetConfig 
} = require('./middleware/security');
const { globalErrorHandler } = require('./middleware/errorHandler');

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
const tasksRoutes = require('./routes/tasks');
const teamsRoutes = require('./routes/teams');
const callHistoryRoutes = require('./routes/callHistory');

// Enhanced security middleware
app.use(helmetConfig);
app.use(securityHeaders);
app.use(ipFilter);
app.use(requestLogger);

// CORS setup
const corsOptions = {
  origin: (origin, callback) => {
    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Allow all origins in development
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Apply general rate limiting to all API requests
app.use('/api', apiRateLimit);

// Input sanitization and security audit
app.use(sanitizeInput);
app.use(securityAudit);

// Socket.io setup
const io = socketIo(server, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const { connectDB, checkDBHealth } = require('./config/database');

// Update health check endpoint to include database status
app.get('/api/health', (req, res) => {
  const dbHealth = checkDBHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Models
const { User, PendingUser, Chat, Message, UserSettings, CallHistory } = require('./models');

// Import middleware functions
const { authenticateToken, requireManager } = require('./middleware/auth');

// Pass io object to routes that need it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check endpoint is defined above with database configuration

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/utils', utilsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/broadcasts', broadcastsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/calls', callHistoryRoutes);

// Additional routes that frontend expects
app.get('/api/pending-users', authenticateToken, requireManager, async (req, res) => {
  try {
    const pendingUsers = await PendingUser.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(pendingUsers);
  } catch (error) {
    logger.error('Get pending users error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
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
    logger.error('Approve user error', { error: error.message, userId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Failed to approve user' 
    });
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
    logger.error('Reject user error', { error: error.message, userId: req.params.id, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Failed to reject user' 
    });
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
    logger.error('Get messages error', { error: error.message, chatId: req.params.chatId, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch messages' 
    });
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
    logger.error('Send message error', { error: error.message, chatId: req.body.chatId, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Failed to send message' 
    });
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
    logger.error('Get user settings error', { error: error.message, requesterId: req.user.userId });
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user settings' 
    });
  }
});

// Socket.IO connection handling with authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      socket.userRole = decoded.role;
      next();
    });
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  logger.socket(`User connected: ${socket.id}`, { userId: socket.userId, userName: socket.userName });
  
  // Automatically join user to their personal room
  socket.join(`user:${socket.userId}`);
  logger.socket(`User joined personal room`, { userId: socket.userId });
  
  // Join user to global tasks room for real-time task synchronization
  socket.join('tasks');
  logger.socket(`User joined tasks room`, { userId: socket.userId });
  
  socket.on('join-user', (userId) => {
    // Validate that user can only join their own room
    if (userId && userId === socket.userId) {
      socket.join(`user:${userId}`);
      logger.socket(`User joined personal room`, { userId, room: `user:${userId}` });
    } else {
      logger.warn(`User attempted to join unauthorized room`, { userId: socket.userId, attemptedRoom: userId });
    }
  });
  
  socket.on('join-chat', async (chatId) => {
    try {
      if (!chatId) {
        return;
      }
      
      // Validate that user is authorized to join this chat
      const chat = await Chat.findById(chatId);
      if (!chat) {
        logger.warn(`User attempted to join non-existent chat`, { userId: socket.userId, chatId });
        return;
      }
      
      // Check if user is a participant or if it's a public chat
      const isParticipant = chat.participants.includes(socket.userId);
      const isPublicChat = ['general', 'announcements'].includes(chat.type);
      
      if (isParticipant || isPublicChat) {
        socket.join(chatId);
        logger.socket(`User joined chat`, { userId: socket.userId, chatId });
      } else {
        logger.warn(`User not authorized to join chat`, { userId: socket.userId, chatId });
      }
    } catch (error) {
      logger.error('Error joining chat', { error: error.message, userId: socket.userId });
    }
  });
  
  socket.on('leave-chat', (chatId) => {
    if (chatId) {
      socket.leave(chatId);
      logger.socket(`User left chat`, { socketId: socket.id, userId: socket.userId, chatId });
    }
  });
  
  socket.on('typing', ({ chatId, userName }) => {
    socket.to(chatId).emit('user-typing', { chatId, userName });
  });
  
  socket.on('stop-typing', ({ chatId, userName }) => {
    socket.to(chatId).emit('user-stop-typing', { chatId, userName });
  });
  
  // Task-related socket events
  socket.on('join-user-room', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      logger.socket(`User joined their personal room`, { userId });
    }
  });

  // Call-related socket events
  socket.on('call:invite', (data) => {
    logger.socket('Call invitation received', { callId: data.callId, callType: data.callType });
    const { callId, chatId, callType, participants } = data;
    
    // Join call room
    socket.join(`call:${callId}`);
    
    // Notify participants
    participants.forEach(participantId => {
      socket.to(`user:${participantId}`).emit('call:invite', {
        callId,
        chatId,
        callerId: socket.userId,
        callerName: socket.userName,
        callType,
        participants
      });
    });
  });

  socket.on('call:join', (data) => {
    logger.socket('User joining call', { userId: socket.userId, callId: data.callId });
    const { callId, chatId } = data;
    
    // Join call room
    socket.join(`call:${callId}`);
    
    // Notify other participants
    socket.to(`call:${callId}`).emit('call:participant-joined', {
      participantId: socket.userId,
      participantName: socket.userName
    });
  });

  socket.on('call:end', (data) => {
    logger.socket('Call ended', { callId: data.callId, endedBy: socket.userId });
    const { callId } = data;
    
    // Notify all participants
    io.to(`call:${callId}`).emit('call:ended', {
      callId,
      endedBy: socket.userId
    });
    
    // Leave call room
    socket.leave(`call:${callId}`);
  });

  socket.on('call:offer', (data) => {
    logger.socket('Call offer sent', { from: socket.userId, to: data.to });
    const { to, offer } = data;
    
    // Forward offer to specific user
    socket.to(`user:${to}`).emit('call:offer', {
      from: socket.userId,
      offer
    });
  });

  socket.on('call:answer', (data) => {
    logger.socket('Call answer sent', { from: socket.userId, to: data.to });
    const { to, answer } = data;
    
    // Forward answer to specific user
    socket.to(`user:${to}`).emit('call:answer', {
      from: socket.userId,
      answer
    });
  });

  socket.on('call:ice-candidate', (data) => {
    logger.socket('ICE candidate sent', { from: socket.userId, to: data.to });
    const { to, candidate } = data;
    
    // Forward ICE candidate to specific user
    socket.to(`user:${to}`).emit('call:ice-candidate', {
      from: socket.userId,
      candidate
    });
  });

  socket.on('call:participant-muted', (data) => {
    logger.socket('Participant muted', { userId: socket.userId, callId: data.callId, isMuted: data.isMuted });
    const { callId, isMuted } = data;
    
    // Notify other participants in the call
    socket.to(`call:${callId}`).emit('call:participant-muted', {
      participantId: socket.userId,
      isMuted
    });
  });

  socket.on('call:participant-video-off', (data) => {
    logger.socket('Participant video toggled', { userId: socket.userId, callId: data.callId, isVideoOff: data.isVideoOff });
    const { callId, isVideoOff } = data;
    
    // Notify other participants in the call
    socket.to(`call:${callId}`).emit('call:participant-video-off', {
      participantId: socket.userId,
      isVideoOff
    });
  });

  socket.on('call:screen-share-started', (data) => {
    logger.socket('Screen share started', { userId: socket.userId, callId: data.callId });
    const { callId } = data;
    
    // Notify other participants in the call
    socket.to(`call:${callId}`).emit('call:screen-share-started', {
      participantId: socket.userId,
      participantName: socket.userName
    });
  });

  socket.on('call:screen-share-stopped', (data) => {
    logger.socket('Screen share stopped', { userId: socket.userId, callId: data.callId });
    const { callId } = data;
    
    // Notify other participants in the call
    socket.to(`call:${callId}`).emit('call:screen-share-stopped', {
      participantId: socket.userId
    });
  });
  
  socket.on('disconnect', () => {
    logger.socket('User disconnected', { socketId: socket.id, userId: socket.userId });
  });
});

// 404 handler for undefined routes
app.use('*', (req, res, next) => {
  logger.warn('Route not found', { 
    method: req.method, 
    url: req.originalUrl, 
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({ 
    success: false,
    error: `Can't find ${req.originalUrl} on this server!` 
  });
});

// Global error handling middleware
app.use(globalErrorHandler);

// Initialize default data
async function createDefaultAdmin() {
  try {
    const managerCount = await User.countDocuments({ role: 'manager', isApproved: true });
    
    if (managerCount === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const admin = new User({
        name: 'Administrator',
        email: 'admin@app.com',
        password: hashedPassword,
        role: 'manager',
        isApproved: true,
        status: 'online',
        avatar: ''
      });
      
      await admin.save();
      logger.info('Default admin created', { email: 'admin@app.com' });
    }
  } catch (error) {
    logger.error('Error creating default admin', { error: error.message });
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
      logger.info('General chat created');
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
      logger.info('Announcements chat created');
    }
  } catch (error) {
    logger.error('Error creating default chats', { error: error.message });
  }
}

async function initializeApp() {
  try {
    await createDefaultAdmin();
    await createDefaultChats();
    logger.info('App initialized successfully');
  } catch (error) {
    logger.error('App initialization failed', { error: error.message });
  }
}

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    await initializeApp();
  } catch (error) {
    logger.warn('Starting server without database connection', { error: error.message });
    // Set flag to indicate MongoDB is not available
    global.mongodbAvailable = false;
  }
  
  const HOST = process.env.HOST || '0.0.0.0';
  server.listen(PORT, HOST, () => {
    logger.info('Server started successfully', {
      port: PORT,
      host: HOST,
      frontendUrl: `http://localhost:${PORT}`,
      apiUrl: `http://localhost:${PORT}/api`,
      externalUrl: `http://${HOST}:${PORT}/api`,
      databaseStatus: global.mongodbAvailable ? 'connected' : 'disconnected'
    });
  });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = { app, server, io };
