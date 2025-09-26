# IIB Chat Application

A comprehensive real-time chat and collaboration platform built with React, Node.js, and WebRTC technology.

## 🚀 Features

### Core Chat Features
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Direct & Group Chats**: Create private conversations or group discussions
- **File Sharing**: Upload and share files with drag-and-drop support
- **Message Reactions**: React to messages with emojis
- **Message Editing & Deletion**: Modify or remove your messages
- **Read Receipts**: See when messages are read by recipients
- **Typing Indicators**: Real-time typing notifications
- **Message Search**: Search through conversation history
- **Link Preview**: Automatic link metadata extraction

### Video & Audio Calls
- **WebRTC Integration**: High-quality peer-to-peer communication
- **Video Calls**: Face-to-face video conversations
- **Audio Calls**: Voice-only communication
- **Screen Sharing**: Share your screen during calls
- **Call Controls**: Mute, camera toggle, and call management
- **Call History**: Track all call activities with timestamps
- **Call Recording**: Automatic call logging and statistics

### User Management
- **User Authentication**: Secure login and registration system
- **Role-based Access**: Manager and Employee roles with different permissions
- **User Profiles**: Customizable profiles with avatars
- **Online Status**: Real-time user presence indicators
- **User Search**: Find and connect with team members
- **Pending User Approval**: Manager approval system for new registrations

### Task Management
- **Task Creation**: Create and assign tasks to team members
- **Task Tracking**: Monitor task progress and completion
- **Task Comments**: Collaborative task discussions
- **Task Categories**: Organize tasks by priority and type
- **Calendar Integration**: View tasks in calendar format
- **Task Notifications**: Real-time task updates

### Team Management
- **Team Creation**: Create and manage project teams
- **Team Members**: Add and remove team members
- **Team Roles**: Assign different roles within teams
- **Team Collaboration**: Shared workspaces for teams
- **Team Analytics**: Track team performance and activity

### Audit Log System
- **Comprehensive Logging**: Track all system activities
- **User Actions**: Monitor login, role changes, and user management
- **Chat Activities**: Log message creation, editing, and deletion
- **Call Records**: Track call history and statistics
- **Advanced Filtering**: Filter logs by action type, date, and user
- **Search Functionality**: Search through audit logs
- **Export Options**: Export logs in CSV, JSON, and PDF formats
- **Real-time Statistics**: View activity statistics and trends
- **Scroll Navigation**: Easy navigation through large log datasets

### Admin Panel
- **User Oversight**: Monitor all user activities
- **System Statistics**: View comprehensive system analytics
- **Content Moderation**: Review and manage chat content
- **Broadcast Messages**: Send announcements to all users
- **System Health**: Monitor application performance

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Permissions**: Granular access control
- **Data Encryption**: Secure data transmission
- **Session Management**: Automatic session handling
- **Input Validation**: Comprehensive input sanitization

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO Client**: Real-time communication
- **WebRTC**: Peer-to-peer video/audio calls
- **React Hot Toast**: User notifications
- **Date-fns**: Date manipulation utilities
- **Lucide React**: Beautiful icons

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Socket.IO**: Real-time bidirectional communication
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **Multer**: File upload handling
- **Cors**: Cross-origin resource sharing
- **Helmet**: Security middleware

### WebRTC Libraries
- **Simple Peer**: WebRTC peer connection management
- **WebRTC Adapter**: Browser compatibility layer

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iib-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/iib-chat
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

4. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately
   npm run server  # Backend only
   npm run client  # Frontend only
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🎯 Usage Guide

### Getting Started
1. **Register/Login**: Create an account or login with existing credentials
2. **Create Admin**: Use the admin creation feature for first-time setup
3. **Join Chats**: Start conversations with team members
4. **Make Calls**: Initiate video or audio calls
5. **Manage Tasks**: Create and assign tasks to team members

### For Managers
- **User Management**: Approve new user registrations
- **Audit Logs**: Monitor system activities and user actions
- **Content Oversight**: Review chat content and user interactions
- **System Analytics**: View comprehensive system statistics
- **Broadcast Messages**: Send announcements to all users

### For Employees
- **Chat Participation**: Join conversations and share files
- **Task Management**: Create and track personal and team tasks
- **Call Features**: Use video/audio calls for communication
- **Profile Management**: Update personal information and settings

## 🔧 Configuration

### Database Setup
The application uses MongoDB for data storage. Ensure MongoDB is running and accessible.

### File Upload Configuration
File uploads are configured to support various formats with size limits. Configure in `server/middleware/upload.js`.

### WebRTC Configuration
WebRTC settings can be modified in the frontend configuration for optimal performance.

## 📊 Features Overview

| Feature | Description | Access Level |
|---------|-------------|--------------|
| Real-time Chat | Instant messaging with typing indicators | All Users |
| Video/Audio Calls | WebRTC-based communication | All Users |
| File Sharing | Drag-and-drop file uploads | All Users |
| Task Management | Create, assign, and track tasks | All Users |
| Team Management | Create and manage teams | Managers |
| Audit Logs | Comprehensive activity tracking | Managers |
| User Management | Approve and manage users | Managers |
| Call History | Track call activities | All Users |

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-secret
PORT=3000
```

### Docker Deployment (Optional)
```bash
docker build -t iib-chat .
docker run -p 3000:3000 iib-chat
```

## 🔒 Security Considerations

- **JWT Token Management**: Secure token storage and rotation
- **Input Validation**: Comprehensive input sanitization
- **CORS Configuration**: Proper cross-origin settings
- **File Upload Security**: File type and size validation
- **WebRTC Security**: Secure peer connections

## 📈 Performance Optimization

- **Vite Build Tool**: Fast development and optimized builds
- **Code Splitting**: Lazy loading for better performance
- **Image Optimization**: Compressed file uploads
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Efficient data caching strategies

## 🐛 Troubleshooting

### Common Issues

1. **WebRTC Connection Issues**
   - Check firewall settings
   - Ensure HTTPS in production
   - Verify STUN/TURN server configuration

2. **Socket.IO Connection Problems**
   - Check server status
   - Verify CORS settings
   - Check network connectivity

3. **File Upload Issues**
   - Verify file size limits
   - Check file type restrictions
   - Ensure proper permissions

### Debug Mode
Enable debug logging by setting `DEBUG=true` in environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

### v1.0.0
- Initial release with core chat features
- WebRTC video/audio calls
- Task management system
- User authentication and roles
- Audit log system
- Admin panel with comprehensive oversight
- File sharing capabilities
- Real-time notifications

---

**Built with ❤️ for IIB Team Collaboration**