# IIB Chat Server

Backend server for the IIB Chat application built with Node.js, Express, MongoDB, and Socket.IO.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Real-time Communication**: Socket.IO for real-time messaging
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer for handling file uploads
- **Security**: Helmet for security headers, CORS configuration, rate limiting
- **Admin Panel**: Manager dashboard with user management and audit logs

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/iib-chat
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:5173
```

3. Start MongoDB service on your system

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Default Admin Account

When the server starts for the first time, it creates a default admin account:

- **Email**: admin@iibchat.com
- **Password**: Admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (manager only)

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message

### Admin Features
- `GET /api/pending-users` - Get pending user registrations
- `POST /api/pending-users/:id/approve` - Approve user
- `POST /api/pending-users/:id/reject` - Reject user
- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/audit-logs` - Get audit logs

## Project Structure

```
server/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── upload.js            # File upload middleware
│   └── validation.js        # Input validation middleware
├── models/
│   ├── User.js              # User model
│   ├── Chat.js              # Chat model
│   ├── Message.js           # Message model
│   ├── PendingUser.js       # Pending user model
│   ├── UserSettings.js      # User settings model
│   └── AuditLog.js          # Audit log model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── chats.js             # Chat routes
│   ├── upload.js            # File upload routes
│   ├── stats.js             # Statistics routes
│   └── broadcasts.js        # Broadcast routes
├── services/
│   └── auditLogService.js   # Audit logging service
├── uploads/                 # File upload directory
├── index.js                 # Main server file
└── package.json             # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/iib-chat |
| JWT_SECRET | JWT secret key | (required) |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |

## Security Features

- JWT authentication with secure token handling
- Password hashing with bcryptjs
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Helmet for security headers
- File upload restrictions and validation

## Socket.IO Events

### Client to Server
- `join-user` - Join user's personal room
- `join-chat` - Join specific chat room
- `leave-chat` - Leave chat room
- `typing` - Send typing indicator

### Server to Client
- `receive-message` - New message received
- `user-typing` - User typing indicator
- `user-approved` - User registration approved
- `global-broadcast` - Global broadcast message

## Development

The server uses nodemon for development with automatic restart on file changes.

## License

MIT License 