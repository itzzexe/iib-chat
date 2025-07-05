require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./config/database-json');

const app = express();
const server = http.createServer(app);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-2024';

// CORS setup
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Socket.io setup
const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Authentication middleware
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

// Pass io to routes
app.use((req, res, next) => {
  req.io = io;
  req.db = db;
  next();
});

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, isManager } = req.body;
    
    // Check if user exists
    const existingUser = db.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (isManager) {
      // Create manager directly
      const newUser = db.users.create({
        name,
        email,
        password: hashedPassword,
        role: 'manager',
        status: 'active',
        avatar: null
      });

      res.json({
        success: true,
        message: 'Manager account created successfully'
      });
    } else {
      // Create pending user
      db.pendingUsers.create({
        name,
        email,
        password: hashedPassword
      });

      res.json({
        success: true,
        message: 'Registration request sent. Please wait for admin approval.'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==================== USER ROUTES ====================

// Get current user
app.get('/api/users/me', authenticateToken, (req, res) => {
  try {
    const user = db.users.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    const users = db.users.findAll().map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get pending users (old endpoint)
app.get('/api/users/pending', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const pendingUsers = db.pendingUsers.findAll();
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Get pending users (new endpoint expected by frontend)
app.get('/api/pending-users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const pendingUsers = db.pendingUsers.findAll();
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// Approve user (old endpoint)
app.post('/api/users/:id/approve', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pendingUser = db.pendingUsers.findAll().find(u => u.id === req.params.id);
    if (!pendingUser) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    // Create active user
    const newUser = db.users.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: 'user',
      status: 'active',
      avatar: null
    });

    // Remove from pending
    db.pendingUsers.delete(req.params.id);

    // Emit event
    req.io.emit('user-approved', { userId: newUser.id });

    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Approve user (new endpoint expected by frontend)
app.post('/api/pending-users/:id/approve', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pendingUser = db.pendingUsers.findAll().find(u => u.id === req.params.id);
    if (!pendingUser) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    // Create active user
    const newUser = db.users.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      role: 'employee',
      status: 'online',
      lastSeen: new Date(),
      avatar: null
    });

    // Remove from pending
    db.pendingUsers.delete(req.params.id);

    // Emit event
    req.io.emit('user-approved', { userId: newUser.id });

    res.json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Reject user (old endpoint)
app.post('/api/users/:id/reject', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = db.pendingUsers.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// Reject user (new endpoint expected by frontend)
app.post('/api/pending-users/:id/reject', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const deleted = db.pendingUsers.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Pending user not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// ==================== CHAT ROUTES ====================

// Get all chats
app.get('/api/chats', authenticateToken, (req, res) => {
  try {
    const chats = db.chats.findAll();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get specific chat
app.get('/api/chats/:id', authenticateToken, (req, res) => {
  try {
    const chat = db.chats.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Create new chat
app.post('/api/chats', authenticateToken, (req, res) => {
  try {
    const { name, type = 'group', participants = [] } = req.body;
    
    const newChat = db.chats.create({
      name,
      type,
      participants: [...participants, req.user.userId],
      unreadCount: 0,
      isArchived: false
    });

    res.json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get chat messages
app.get('/api/chats/:id/messages', authenticateToken, (req, res) => {
  try {
    const messages = db.messages.findByChatId(req.params.id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
app.post('/api/chats/:id/messages', authenticateToken, (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const user = db.users.findById(req.user.userId);

    const message = db.messages.create({
      chatId: req.params.id,
      senderId: req.user.userId,
      senderName: user.name,
      content,
      type,
      reactions: [],
      readBy: []
    });

    // Emit to chat room
    req.io.to(req.params.id).emit('new-message', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==================== MESSAGE ROUTES ====================

// Get messages for a chat (alternative endpoint)
app.get('/api/messages/:chatId', authenticateToken, (req, res) => {
  try {
    const messages = db.messages.findByChatId(req.params.chatId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message (alternative endpoint)
app.post('/api/messages', authenticateToken, (req, res) => {
  try {
    const { chatId, content, type = 'text', replyTo } = req.body;
    const user = db.users.findById(req.user.userId);

    const message = db.messages.create({
      chatId,
      senderId: req.user.userId,
      senderName: user.name,
      content,
      type,
      replyTo,
      reactions: [],
      readBy: []
    });

    // Emit to chat room
    req.io.to(chatId).emit('receive-message', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
app.post('/api/chats/:chatId/messages/read', authenticateToken, (req, res) => {
  try {
    const { messageIds } = req.body;
    // In a real implementation, you would update the readBy array for these messages
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Add reaction to message
app.post('/api/messages/:messageId/reactions', authenticateToken, (req, res) => {
  try {
    const { emoji } = req.body;
    // In a real implementation, you would add/remove reactions
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// ==================== UTILITY ROUTES ====================

// Extract URL metadata
app.post('/api/utils/extract-metadata', authenticateToken, (req, res) => {
  try {
    const { url } = req.body;
    // Mock response for URL metadata
    res.json({
      ogTitle: 'Sample Title',
      ogDescription: 'Sample description',
      ogImage: [{ url: 'https://via.placeholder.com/300x200' }],
      ogUrl: url,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract metadata' });
  }
});

// ==================== SEARCH ROUTES ====================

// Search messages
app.get('/api/search/messages', authenticateToken, (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ data: [] });
    }
    
    // Search through all messages
    const allMessages = db.messages.findAll();
    const searchResults = allMessages.filter(msg => 
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({ data: searchResults });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==================== USER SETTINGS ROUTES ====================

// Get user settings
app.get('/api/user-settings', authenticateToken, (req, res) => {
  try {
    // Mock user settings
    res.json({
      theme: 'auto',
      language: 'en',
      notifications: true,
      status: 'online'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// ==================== STATS ROUTES ====================

// Get dashboard statistics
app.get('/api/stats/dashboard', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = db.users.findAll();
    const chats = db.chats.findAll();
    const messages = db.messages.findAll();
    const pendingUsers = db.pendingUsers.findAll();

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'online').length,
      totalChats: chats.length,
      totalMessages: messages.length,
      pendingUsers: pendingUsers.length,
      recentActivity: messages.slice(-10).reverse() // Last 10 messages
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get audit logs
app.get('/api/stats/audit-logs', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Mock audit logs - in a real app, you'd have an audit log collection
    const auditLogs = [
      {
        id: '1',
        action: 'User Login',
        userId: req.user.userId,
        userName: 'Admin',
        timestamp: new Date(),
        details: 'User logged in successfully'
      },
      {
        id: '2',
        action: 'User Approved',
        userId: req.user.userId,
        userName: 'Admin',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        details: 'Approved pending user registration'
      }
    ];

    const paginatedLogs = auditLogs.slice(skip, skip + parseInt(limit));
    
    res.json({
      logs: paginatedLogs,
      total: auditLogs.length,
      page: parseInt(page),
      totalPages: Math.ceil(auditLogs.length / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ==================== OVERSIGHT ROUTES ====================

// Get direct chats for oversight
app.get('/api/chats/oversee/direct', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all direct chats (type: 'direct')
    const directChats = db.chats.findAll().filter(chat => chat.type === 'direct');
    
    res.json(directChats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch direct chats for oversight' });
  }
});

// Get messages for oversight
app.get('/api/chats/:chatId/oversee/messages', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 50 } = req.query;
    const messages = db.messages.findByChatId(req.params.chatId);
    
    // Paginate messages
    const skip = (page - 1) * limit;
    const paginatedMessages = messages.slice(skip, skip + parseInt(limit));
    
    res.json(paginatedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages for oversight' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'json-file'
  });
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  socket.on('join-user', (userId) => {
    if (userId) {
      socket.join(userId);
    }
  });
  
  socket.on('join-chat', (chatId) => {
    if (chatId) {
      socket.join(chatId);
    }
  });
  
  socket.on('leave-chat', (chatId) => {
    if (chatId) {
      socket.leave(chatId);
    }
  });
  
  socket.on('typing', ({ chatId, userName }) => {
    socket.to(chatId).emit('user-typing', { chatId, userName });
  });
  
  socket.on('disconnect', () => {
    // User disconnected - no need to log this
  });
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==================== CREATE DEFAULT ADMIN ====================

async function createDefaultAdmin() {
  const adminEmail = 'admin@iibchat.com';
  const existingAdmin = db.users.findByEmail(adminEmail);
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.users.create({
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'manager',
      status: 'online',
      lastSeen: new Date(),
      avatar: null
    });
    console.log('✅ Default admin created (admin@iibchat.com / admin123)');
  }
}

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`🌐 Backend API available at: http://localhost:${PORT}/api`);
  console.log(`📁 Using JSON file database (no MongoDB required)`);
  
  // Create default admin
  await createDefaultAdmin();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io }; 