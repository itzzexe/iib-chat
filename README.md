# 🚀 IIB Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB. Designed for teams and organizations with comprehensive user management, real-time messaging, and administrative features.

## 👨‍💻 Developer
This project is developed and maintained by **ITZ**. 

![Chat Application](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green)

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure User Registration** with email validation
- **JWT-based Authentication** with automatic token refresh
- **Role-based Access Control** (Manager/Employee)
- **Admin Dashboard** for user management
- **Account Approval System** for new registrations
- **English Language Interface** throughout the application

### 💬 Real-time Messaging
- **Instant Messaging** with Socket.IO
- **Direct & Group Chats** support
- **Message Reactions** with emoji picker
- **Typing Indicators** for active conversations
- **Message Editing & Deletion** capabilities
- **File Upload & Sharing** with preview support
- **Link Preview** with automatic metadata extraction

### 👥 User Management
- **User Profile Management** with avatar upload
- **Real-time Status Indicators** (Online/Offline/Away/Busy)
- **Member Directory** with search functionality
- **Role Assignment** and permission management
- **User Activity Tracking** and audit logs

### 🎨 Modern UI/UX
- **Responsive Design** for all devices
- **Dark/Light Theme** toggle
- **Intuitive Navigation** with sidebar layout
- **Real-time Notifications** with browser integration
- **Smooth Animations** and transitions
- **Accessibility Features** for inclusive design

### 🛡️ Security & Privacy
- **Data Encryption** for sensitive information
- **CORS Protection** and security headers
- **Input Validation** and sanitization
- **Rate Limiting** for API endpoints
- **Audit Logging** for administrative actions
- **Secure File Upload** with type validation

### 📊 Administrative Features
- **Admin Dashboard** with analytics
- **User Management Panel** with bulk operations
- **Chat Oversight** for managers
- **Broadcast Messaging** system
- **Audit Log Viewer** for tracking activities
- **System Health Monitoring**
- **Team Management System** with role-based permissions
- **Task Management** with calendar integration

## 🏗️ Architecture

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express.js    │    │ • User          │
│ • TypeScript    │    │ • Socket.IO     │    │ • Chat          │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Message       │
│ • Vite          │    │ • Multer        │    │ • Task          │
│ • Socket.IO     │    │ • Helmet        │    │ • Team          │
│                 │    │ • Rate Limiting │    │ • AuditLog      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   File Storage  │    │   Indexes       │
│   Communication │    │   (Uploads)     │    │   & Validation  │
│                 │    │                 │    │                 │
│ • WebSocket     │    │ • Image Files   │    │ • Email Index   │
│ • Typing        │    │ • Documents     │    │ • Chat Index    │
│ • Notifications │    │ • Avatars       │    │ • Message Index │
│ • Status Updates│    │ • Metadata      │    │ • Text Search   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture (React + TypeScript)
```
src/
├── components/          # Reusable UI components
│   ├── Admin/          # Admin dashboard components
│   ├── Auth/           # Authentication forms
│   ├── Chat/           # Chat interface components
│   ├── Layout/         # Layout and navigation
│   ├── Settings/       # User settings
│   ├── Tasks/          # Task and team management
│   └── UI/             # Common UI elements
├── context/            # React context providers
├── services/           # API and utility services
├── types/              # TypeScript type definitions
└── styles/             # CSS and styling
```

### Backend Architecture (Node.js + Express)
```
server/
├── config/             # Database and app configuration
├── middleware/         # Express middleware
├── models/             # MongoDB schemas
├── routes/             # API route handlers
├── services/           # Business logic services
└── uploads/            # File upload storage
```

## 🗄️ Database Schema

### Entity Relationship Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    User     │    │    Chat     │    │   Message   │
│             │    │             │    │             │
│ • id        │◄──►│ • id        │◄──►│ • id        │
│ • name      │    │ • name      │    │ • chatId    │
│ • email     │    │ • type      │    │ • senderId  │
│ • password  │    │ • participants│  │ • content   │
│ • role      │    │ • createdBy │    │ • type      │
│ • status    │    │ • isActive  │    │ • reactions │
│ • avatar    │    │ • timestamps│    │ • readBy    │
│ • timestamps│    └─────────────┘    │ • timestamps│
└─────────────┘            │          └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Task     │    │    Team     │    │  AuditLog   │
│             │    │             │    │             │
│ • id        │    │ • id        │    │ • id        │
│ • title     │    │ • name      │    │ • userId    │
│ • description│   │ • description│   │ • action    │
│ • status    │    │ • leader    │    │ • resource  │
│ • priority  │    │ • members   │    │ • resourceId│
│ • assignedTo│    │ • isActive  │    │ • details   │
│ • createdBy │    │ • timestamps│    │ • timestamps│
│ • teamId    │    └─────────────┘    └─────────────┘
│ • timestamps│
└─────────────┘
```

### Detailed Schema Definitions

#### User Model
```javascript
{
  name: String (required, min: 2 chars, trim: true),
  email: String (required, unique, lowercase, email format),
  password: String (required, min: 6 chars, hashed, select: false),
  role: String (enum: ['manager', 'employee'], default: 'employee'),
  avatar: String (default: ''),
  status: String (enum: ['online', 'offline', 'away', 'busy'], default: 'offline'),
  lastSeen: Date (default: now),
  isApproved: Boolean (default: false),
  registeredAt: Date (default: now),
  timestamps: true
}
```

#### Chat Model
```javascript
{
  name: String (required, max: 100 chars, trim: true),
  type: String (enum: ['direct', 'group', 'general', 'announcements'], required),
  participants: [String] (required, User IDs),
  lastMessage: {
    content: String (max: 1000 chars),
    senderId: String,
    senderName: String,
    timestamp: Date
  },
  description: String (max: 500 chars),
  createdBy: String (User ID),
  isArchived: Boolean (default: false),
  unreadCount: Number (default: 0, min: 0),
  timestamps: true
}
```

#### Message Model
```javascript
{
  chatId: String (required, indexed),
  senderId: String (required, indexed),
  senderName: String (required, max: 50 chars),
  content: String (required, max: 5000 chars),
  type: String (enum: ['text', 'file', 'announcement', 'general'], default: 'text'),
  fileUrl: String (conditional, required for file type),
  fileName: String,
  fileType: String,
  isUrgent: Boolean (default: false),
  reactions: [{
    emoji: String (required, max: 10 chars),
    userId: String (required),
    userName: String (required, max: 50 chars),
    timestamp: Date (default: now)
  }],
  replyTo: ObjectId (ref: 'Message'),
  replyToContent: String,
  replyToSender: String,
  isDeleted: Boolean (default: false),
  editedAt: Date,
  readBy: [{
    userId: String,
    readAt: Date (default: now)
  }],
  fileSize: Number,
  timestamps: true
}
```

#### Task Model
```javascript
{
  title: String (required, max: 200 chars),
  description: String (max: 1000 chars),
  status: String (enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending'),
  priority: String (enum: ['low', 'medium', 'high', 'urgent'], default: 'medium'),
  assignedTo: ObjectId (ref: 'User'),
  createdBy: ObjectId (ref: 'User', required),
  teamId: ObjectId (ref: 'Team'),
  dueDate: Date,
  completedAt: Date,
  attachments: [String] (file URLs),
  comments: [{
    userId: ObjectId (ref: 'User'),
    content: String (required),
    timestamp: Date (default: now)
  }],
  timestamps: true
}
```

#### Team Model
```javascript
{
  name: String (required, max: 100 chars),
  description: String (max: 500 chars),
  leader: ObjectId (ref: 'User', required),
  members: [ObjectId] (ref: 'User'),
  isActive: Boolean (default: true),
  timestamps: true
}
```

#### AuditLog Model
```javascript
{
  userId: ObjectId (ref: 'User'),
  action: String (required, max: 100 chars),
  resource: String (required, max: 100 chars),
  resourceId: ObjectId,
  details: Object,
  ipAddress: String (max: 45 chars),
  userAgent: String (max: 500 chars),
  timestamp: Date (default: now)
}
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **MongoDB** 5.x or higher
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/itzzexe/iib-chat.git
   cd iib-chat
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Create environment file for backend
   cd server
   # Create .env file with the following content:
   # MONGODB_URI=mongodb://localhost:27017/iib-chat
   # JWT_SECRET=your-secret-key
   # PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Make sure MongoDB is running
   # The application will create necessary collections automatically
   ```

5. **Start the Application**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   
   # Or start separately:
   # Backend
   npm run server:dev
   
   # Frontend (in new terminal)
   npm run dev
   ```

6. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000/api
   - **Default Admin**: admin@app.com / admin123

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/iib-chat

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# Logging
LOG_LEVEL=info
```

### Frontend Configuration
The frontend automatically connects to the backend API. For production deployment, update the API base URL in `src/services/dataService.ts`.

## 📱 Usage

### For End Users

1. **Registration**
   - Visit the application URL
   - Click "Register" and fill in your details
   - Wait for admin approval
   - Login with approved credentials

2. **Messaging**
   - Start direct chats with team members
   - Join group conversations
   - Send messages, files, and reactions
   - Use @mentions for notifications

3. **Task Management**
   - View assigned tasks and team tasks
   - Update task status and progress
   - Add comments and attachments
   - Use calendar view for scheduling

4. **Team Collaboration**
   - View team information and members
   - Participate in team tasks
   - Track team progress and statistics

5. **Profile Management**
   - Upload profile picture
   - Update personal information
   - Manage notification preferences
   - Set availability status

### For Administrators

1. **User Management**
   - Approve/reject new registrations
   - Assign user roles (Manager/Employee)
   - Monitor user activity
   - Manage user permissions

2. **Team Management**
   - Create and manage teams
   - Assign team leads and members
   - Monitor team performance
   - Manage team permissions

3. **Task Administration**
   - Create and assign tasks
   - Monitor task progress
   - Generate task reports
   - Manage task priorities

4. **Chat Oversight**
   - View all chat conversations
   - Delete inappropriate messages
   - Broadcast announcements
   - Monitor system usage

5. **System Administration**
   - View audit logs
   - Monitor system health
   - Manage application settings
   - Export data for compliance

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start both frontend and backend
npm run server:dev   # Start backend only
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Linting
npm run lint         # Check code quality
npm run lint:fix     # Fix linting issues

# Database
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database
```

### Tech Stack

#### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Socket.IO Client** - Real-time communication
- **React Router** - Client-side routing
- **React Hot Toast** - Notifications
- **Lucide React** - Icon library

#### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware

## 🚀 Deployment

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=mongodb://your-production-db
   export JWT_SECRET=your-production-secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

### Environment-specific Configurations

#### Development
- Hot reloading enabled
- Detailed error messages
- Debug logging
- CORS enabled for localhost

#### Production
- Optimized builds
- Error logging to files
- Security headers enabled
- Rate limiting active

## 🔒 Security

### Implemented Security Measures

- **Authentication**: JWT tokens with secure httpOnly cookies
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive validation for all inputs
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: API endpoint protection
- **File Upload Security**: Type and size validation
- **XSS Protection**: Input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **Password Security**: Bcrypt hashing with salt rounds

### Security Best Practices

1. **Regular Updates**: Keep dependencies updated
2. **Environment Variables**: Never commit secrets to version control
3. **HTTPS**: Use SSL/TLS in production
4. **Database Security**: Use MongoDB authentication
5. **Monitoring**: Implement logging and monitoring
6. **Backup**: Regular database backups

## 📊 Performance

### Optimization Features

- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Automatic image compression
- **Caching**: Client-side and server-side caching
- **Database Indexing**: Optimized queries
- **Bundle Splitting**: Efficient code splitting
- **CDN Ready**: Static asset optimization

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB (gzipped)
- **API Response Time**: < 200ms average
- **WebSocket Latency**: < 50ms

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Socket.IO** for real-time capabilities
- **MongoDB** for flexible data storage
- **Tailwind CSS** for utility-first styling
- **Open Source Community** for inspiration and tools

## 📞 Support

For support and questions:

- **GitHub Issues**: [Create an issue](https://github.com/itzzexe/iib-chat/issues)
- **Documentation**: Check the docs folder
- **Community**: Join our discussions

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Mobile App** (React Native)
- [ ] **Video/Voice Calls** integration
- [ ] **Advanced Search** with filters
- [ ] **Message Encryption** end-to-end
- [ ] **Plugin System** for extensions
- [ ] **API Documentation** with Swagger
- [ ] **Advanced Analytics** dashboard
- [ ] **Time Tracking** integration
- [ ] **Project Management** features
- [ ] **Advanced Reporting** tools

### Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added file sharing and reactions
- **v1.2.0** - Enhanced admin features and security
- **v1.3.0** - UI/UX improvements and performance optimization
- **v1.4.0** - Added task management and calendar system
- **v1.5.0** - Added team management with role-based permissions

---

<div align="center">
  <p>Developed with ❤️ by ITZ</p>
  <p>
    <a href="https://github.com/itzzexe/iib-chat">⭐ Star this project</a> |
    <a href="https://github.com/itzzexe/iib-chat/issues">🐛 Report Bug</a> |
    <a href="https://github.com/itzzexe/iib-chat/issues">💡 Request Feature</a>
  </p>
</div> 