# IIB Chat Server

Backend server for the IIB Chat Application built with Node.js, Express, Socket.IO, and MongoDB.

## 🏗️ Architecture

### Server Structure
```
server/
├── config/             # Database and app configuration
│   └── database.js     # MongoDB connection setup
├── middleware/         # Express middleware
│   ├── auth.js         # JWT authentication middleware
│   ├── upload.js       # File upload handling
│   └── validation.js   # Input validation middleware
├── models/             # MongoDB schemas
│   ├── User.js         # User model
│   ├── Chat.js         # Chat model
│   ├── Message.js      # Message model
│   ├── Task.js         # Task model
│   ├── Team.js         # Team model
│   ├── AuditLog.js     # Audit log model
│   └── index.js        # Model exports
├── routes/             # API route handlers
│   ├── auth.js         # Authentication routes
│   ├── chats.js        # Chat management routes
│   ├── tasks.js        # Task management routes
│   ├── teams.js        # Team management routes
│   ├── users.js        # User management routes
│   ├── upload.js       # File upload routes
│   ├── search.js       # Search functionality routes
│   ├── stats.js        # Statistics and analytics routes
│   └── broadcasts.js   # Broadcast messaging routes
├── services/           # Business logic services
│   └── auditLogService.js  # Audit logging service
├── uploads/            # File upload storage
├── index.js            # Main server file
└── package.json        # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **MongoDB** 5.x or higher
- **npm** or **yarn** package manager

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Create .env file with the following content:
   MONGODB_URI=mongodb://localhost:27017/iib-chat
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   CORS_ORIGIN=http://localhost:5173
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=200
   LOG_LEVEL=info
   ```

3. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the server**
   - **API Base URL**: http://localhost:3000/api
   - **Health Check**: http://localhost:3000/api/health
   - **Socket.IO**: http://localhost:3000

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/iib-chat` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` | No |
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `0.0.0.0` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `MAX_FILE_SIZE` | Maximum file upload size (bytes) | `5242880` (5MB) | No |
| `UPLOAD_PATH` | File upload directory | `./uploads` | No |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:5173` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window | `900000` (15min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `200` | No |
| `LOG_LEVEL` | Logging level | `info` | No |

### Database Configuration

The server uses MongoDB with Mongoose ODM. The connection is configured in `config/database.js`:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iib-chat';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/role` - Update user role
- `DELETE /api/users/:id` - Delete user

### Chats
- `GET /api/chats` - Get all chats
- `GET /api/chats/:id` - Get chat by ID
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:id` - Update chat
- `DELETE /api/chats/:id` - Delete chat
- `GET /api/chats/oversee/direct` - Get direct chats for oversight
- `GET /api/chats/oversee/:id/messages` - Get messages for oversight

### Messages
- `GET /api/messages/:chatId` - Get messages for chat
- `POST /api/messages` - Send message
- `PUT /api/chats/:chatId/messages/:messageId` - Edit message
- `DELETE /api/chats/:chatId/messages/:messageId` - Delete message
- `POST /api/chats/:chatId/messages/read` - Mark messages as read
- `POST /api/messages/:messageId/reactions` - Add reaction

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add task comment
- `GET /api/tasks/calendar/events` - Get calendar events

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### File Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `DELETE /api/upload/:filename` - Delete file

### Search
- `GET /api/search/messages?query=:query` - Search messages

### Statistics
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/audit-logs` - Get audit logs

### Broadcasts
- `POST /api/broadcasts/send` - Send broadcast message

### Utilities
- `POST /api/utils/extract-metadata` - Extract link metadata
- `GET /api/health` - Health check

## 🔌 Socket.IO Events

### Client to Server
- `join-user` - Join user's personal room
- `join-chat` - Join chat room
- `leave-chat` - Leave chat room
- `typing` - User typing indicator
- `stop-typing` - User stopped typing

### Server to Client
- `receive-message` - New message received
- `messageUpdated` - Message updated
- `messageDeleted` - Message deleted
- `user-typing` - User typing in chat
- `user-stop-typing` - User stopped typing
- `messagesRead` - Messages marked as read
- `global-broadcast` - Broadcast message
- `chat-deleted` - Chat deleted
- `chat-cleared` - Chat messages cleared
- `task:created` - Task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `task:assigned` - Task assigned

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Manager/Employee)
- Token expiration and refresh
- Secure password hashing with bcrypt

### Input Validation
- Comprehensive validation for all inputs
- Sanitization of user data
- Type checking and format validation

### Security Headers
- Helmet.js for security headers
- CORS protection
- Rate limiting
- XSS protection

### File Upload Security
- File type validation
- File size limits
- Secure file storage
- Virus scanning (optional)

## 📊 Database Models

### User Model
```javascript
{
  name: String (required, min: 2 chars),
  email: String (required, unique, email format),
  password: String (required, min: 6 chars, hashed),
  role: String (enum: ['manager', 'employee']),
  avatar: String,
  status: String (enum: ['online', 'offline', 'away', 'busy']),
  lastSeen: Date,
  isApproved: Boolean,
  registeredAt: Date,
  timestamps: true
}
```

### Chat Model
```javascript
{
  name: String (required),
  type: String (enum: ['direct', 'group', 'general', 'announcements']),
  participants: [String],
  lastMessage: {
    content: String,
    senderId: String,
    senderName: String,
    timestamp: Date
  },
  description: String,
  createdBy: String,
  isArchived: Boolean,
  unreadCount: Number,
  timestamps: true
}
```

### Message Model
```javascript
{
  chatId: String (required),
  senderId: String (required),
  senderName: String (required),
  content: String (required),
  type: String (enum: ['text', 'file', 'announcement', 'general']),
  fileUrl: String,
  fileName: String,
  fileType: String,
  isUrgent: Boolean,
  reactions: [{
    emoji: String,
    userId: String,
    userName: String,
    timestamp: Date
  }],
  replyTo: ObjectId,
  replyToContent: String,
  replyToSender: String,
  isDeleted: Boolean,
  editedAt: Date,
  readBy: [{
    userId: String,
    readAt: Date
  }],
  fileSize: Number,
  timestamps: true
}
```

### Task Model
```javascript
{
  title: String (required),
  description: String,
  status: String (enum: ['pending', 'in-progress', 'completed', 'cancelled']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  assignedTo: ObjectId (ref: 'User'),
  createdBy: ObjectId (ref: 'User', required),
  teamId: ObjectId (ref: 'Team'),
  dueDate: Date,
  completedAt: Date,
  attachments: [String],
  comments: [{
    userId: ObjectId (ref: 'User'),
    content: String,
    timestamp: Date
  }],
  timestamps: true
}
```

### Team Model
```javascript
{
  name: String (required),
  description: String,
  leader: ObjectId (ref: 'User', required),
  members: [ObjectId] (ref: 'User'),
  isActive: Boolean,
  timestamps: true
}
```

### AuditLog Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  action: String (required),
  resource: String (required),
  resourceId: ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

## 🚀 Deployment

### Production Setup

1. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-production-db
   export JWT_SECRET=your-production-secret
   export PORT=3000
   ```

2. **Install dependencies**
   ```bash
   npm install --production
   ```

3. **Start the server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start index.js --name "iib-chat-server"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 📈 Performance Optimization

### Database Optimization
- Indexed fields for faster queries
- Connection pooling
- Query optimization
- Aggregation pipelines

### Caching
- Redis integration (optional)
- Memory caching for frequently accessed data
- Response caching for static content

### Monitoring
- Health check endpoints
- Performance metrics
- Error logging
- Audit trails

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start            # Start production server

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode

# Linting
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues
```

### Code Structure

- **Routes**: Handle HTTP requests and responses
- **Models**: Define database schemas and validation
- **Middleware**: Authentication, validation, and error handling
- **Services**: Business logic and external integrations
- **Config**: Database and application configuration

### Error Handling

The server implements comprehensive error handling:

- Global error middleware
- Validation error handling
- Database error handling
- Authentication error handling
- File upload error handling

## 📞 Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/itzzexe/iib-chat/issues)
- **Documentation**: Check the main README.md
- **Community**: Join our discussions

---

<div align="center">
  <p>Developed with ❤️ by ITZ</p>
</div> 