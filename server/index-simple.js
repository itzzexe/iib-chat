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

// ==================== USER ROUTES ====================

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

// Get pending users
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

// Approve user
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

// Reject user
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
      reactions: []
    });

    // Emit to chat room
    req.io.to(req.params.id).emit('new-message', message);

    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
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
  
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Global error:', err);
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
      status: 'active',
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