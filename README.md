# IIB Chat Application

A modern, real-time chat application built with React, TypeScript, Node.js, and Socket.IO. Features user management, real-time messaging, file sharing, and administrative controls.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant messaging with Socket.IO
- **User Authentication**: Secure login/registration system
- **User Management**: Admin approval system for new users
- **File Sharing**: Upload and share images and documents
- **Multi-language Support**: Arabic and English interface
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on desktop and mobile devices

### Administrative Features
- **User Approval System**: Managers can approve/reject new registrations
- **Member Management**: Add, remove, and manage user roles
- **Private Chat Oversight**: Managers can monitor private conversations
- **Audit Logging**: Track user actions and system events
- **Broadcasting**: Send announcements to all users

### Technical Features
- **Real-time Updates**: Live message updates and typing indicators
- **Emoji Support**: Full emoji picker integration
- **Message Reactions**: React to messages with emojis
- **Search Functionality**: Search through messages and users
- **Notification System**: Browser notifications for new messages
- **JSON Database**: No MongoDB required - uses local JSON files

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **React Hot Toast** for notifications
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **JSON file storage** (no database required)
- **CORS** and security middleware

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### Option 1: Using PowerShell Script (Windows)

```powershell
# Clone the repository
git clone https://github.com/itzzexe/iib-chat.git
cd iib-chat

# Run the application
.\start-app-simple.ps1
```

### Option 2: Manual Setup

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

3. **Start the application**

   **Terminal 1 - Backend:**
    ```bash
   cd server
   npm start
    ```

   **Terminal 2 - Frontend:**
    ```bash
    npm run dev
    ```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health

## 🔐 Default Credentials

### Admin Account
- **Email**: admin@iibchat.com
- **Password**: admin123

### Test User Account
You can register new users through the registration form, which will require admin approval.

## 📁 Project Structure

```
iib-chat/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── Admin/              # Admin dashboard components
│   │   ├── Auth/               # Authentication components
│   │   ├── Chat/               # Chat-related components
│   │   ├── Layout/             # Layout components
│   │   ├── MemberManagement/   # User management components
│   │   ├── Settings/           # Settings components
│   │   └── UI/                 # Reusable UI components
│   ├── context/                # React context providers
│   ├── services/               # API and utility services
│   ├── types/                  # TypeScript type definitions
│   └── main.tsx               # Application entry point
├── server/                      # Backend source code
│   ├── config/                 # Configuration files
│   ├── middleware/             # Express middleware
│   ├── models/                 # Data models
│   ├── routes/                 # API routes
│   ├── services/               # Business logic services
│   ├── uploads/                # File upload directory
│   ├── data/                   # JSON database files
│   └── index-simple.js         # Server entry point
├── public/                      # Static assets
│   ├── locales/                # Translation files
│   └── sounds/                 # Audio files
└── docs/                       # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/iibchat
JWT_SECRET=your-super-secure-jwt-secret
FRONTEND_URL=http://localhost:5173
```

### Database

The application uses JSON files for data storage by default. Files are stored in `server/data/`:

- `users.json` - User accounts
- `chats.json` - Chat rooms
- `messages.json` - Chat messages
- `pending-users.json` - Pending user registrations

## 🎯 Usage

### For Regular Users
1. Register an account (requires admin approval)
2. Wait for admin approval
3. Login and start chatting
4. Join different chat rooms
5. Send messages, files, and reactions
6. Customize settings and profile

### For Administrators
1. Login with admin credentials
2. Approve/reject user registrations
3. Manage user roles and permissions
4. Monitor private chat conversations
5. Send system-wide announcements
6. View audit logs and system statistics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Server-side validation for all inputs
- **XSS Protection**: Sanitized user inputs

## 🌍 Internationalization

The application supports multiple languages:
- **English** (default)
- **Arabic** (RTL support)

Translation files are located in `public/locales/`.

## 📱 Mobile Support

The application is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Tablets

## 🔧 Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend
cd server
npm start            # Start production server
npm run dev          # Start development server with nodemon
```

### Development Guidelines

1. **Code Style**: Follow TypeScript and React best practices
2. **Commits**: Use conventional commit messages
3. **Testing**: Write tests for new features
4. **Documentation**: Update README for new features

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT secret configuration
   - Verify token expiration

3. **File Upload Issues**
   - Check `server/uploads` directory permissions
   - Verify file size limits
   - Check CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `docs/` folder

## 🎉 Acknowledgments

- React team for the amazing framework
- Socket.IO for real-time communication
- Tailwind CSS for the utility-first CSS framework
- All contributors and users of this application

---

**Made with ❤️ for the IIB community**
