# IIB Chat Application

A modern, real-time chat application built with React, Node.js, Express, MongoDB, and Socket.IO. Features include user authentication, role-based access control, file sharing, and an admin dashboard.

## 🚀 Features

### Core Features
- **Real-time Messaging**: Instant messaging with Socket.IO
- **User Authentication**: Secure JWT-based authentication
- **Role-based Access**: Manager and Employee roles with different permissions
- **File Sharing**: Upload and share files with other users
- **User Management**: Admin dashboard for managing users and permissions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Advanced Features
- **Message Reactions**: React to messages with emojis
- **Message Replies**: Reply to specific messages
- **Typing Indicators**: See when others are typing
- **User Status**: Online/offline status indicators
- **Search Functionality**: Search through messages and users
- **Audit Logs**: Track user actions and system events
- **Broadcasting**: Send announcements to all users

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time communication
- **Axios** for API calls
- **React Router** for navigation

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Helmet** for security headers

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (v4.4 or higher)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd iib-chat-application
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# macOS with Homebrew
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Start the Application

#### Option 1: Using the Production Script (Recommended)
```bash
.\start-app-production.ps1
```

#### Option 2: Manual Start
```bash
# Terminal 1 - Start Backend
cd server
npm start

# Terminal 2 - Start Frontend
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Default Admin**: admin@iibchat.com / Admin123

## 📁 Project Structure

```
iib-chat-application/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── Admin/               # Admin dashboard components
│   │   ├── Auth/                # Authentication components
│   │   ├── Chat/                # Chat-related components
│   │   ├── Layout/              # Layout components
│   │   ├── MemberManagement/    # User management components
│   │   ├── Search/              # Search components
│   │   ├── Settings/            # Settings components
│   │   ├── UI/                  # Reusable UI components
│   │   └── UserRequests/        # User request components
│   ├── context/                 # React context providers
│   ├── services/                # API services
│   ├── types/                   # TypeScript type definitions
│   └── data/                    # Mock data and constants
├── server/                       # Backend source code
│   ├── config/                  # Configuration files
│   ├── middleware/              # Express middleware
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── services/                # Business logic services
│   ├── uploads/                 # File upload directory
│   └── index.js                 # Main server file
├── public/                       # Static assets
├── start-app-production.ps1      # Production startup script
├── start-app.ps1                # Development startup script
└── README.md                    # This file
```

## 🔐 Default Accounts

When the application starts for the first time, it creates a default admin account:

- **Email**: admin@iibchat.com
- **Password**: Admin123
- **Role**: Manager

## 🌟 Key Features Explained

### User Roles
- **Manager**: Full access to admin dashboard, user management, and all features
- **Employee**: Standard user with access to messaging and basic features

### Chat Types
- **Direct Messages**: Private conversations between two users
- **Group Chats**: Multi-user conversations
- **General Chat**: Public chat for all users
- **Announcements**: Manager-only broadcast channel

### Admin Dashboard
- User management (approve/reject/delete users)
- Role assignment
- System statistics
- Audit logs
- User activity monitoring

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/iib-chat
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:5173
```

### Database Configuration

The application uses MongoDB as the primary database. The connection string can be configured in the `.env` file or defaults to `mongodb://localhost:27017/iib-chat`.

## 🚀 Deployment

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Start the backend in production mode:
```bash
cd server
NODE_ENV=production npm start
```

### Docker Deployment (Optional)

The application can be containerized using Docker. Create appropriate Dockerfile and docker-compose.yml files for your deployment needs.

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (manager only)

### Chat Endpoints
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message

### Admin Endpoints
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/audit-logs` - Get audit logs
- `GET /api/pending-users` - Get pending user registrations
- `POST /api/pending-users/:id/approve` - Approve user
- `POST /api/pending-users/:id/reject` - Reject user

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`

2. **Port Already in Use**
   - Kill processes using ports 3000 or 5173
   - Or change ports in configuration

3. **Authentication Issues**
   - Clear browser storage
   - Check JWT secret configuration

4. **File Upload Issues**
   - Ensure `uploads` directory exists
   - Check file permissions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Socket.IO team for real-time communication
- MongoDB team for the database
- All contributors and users of this application

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ by the IIB Chat Team**
