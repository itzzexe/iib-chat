# IIB Chat Application

A modern, secure real-time chat application built with React, TypeScript, Node.js, and MongoDB.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **User authentication** with JWT tokens
- **Role-based access control** (Manager/Employee)
- **User approval system** for new registrations
- **File sharing** capabilities
- **Message reactions** with emoji support
- **Dark/Light theme** support
- **Responsive design** with Tailwind CSS
- **Real-time notifications**
- **Typing indicators**
- **User status tracking**

## 🏗️ Architecture

### Backend (Node.js)
```
server/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # User schema
│   ├── PendingUser.js       # Pending user schema
│   ├── Chat.js              # Chat schema
│   ├── Message.js           # Message schema
│   ├── UserSettings.js      # User settings schema
│   └── index.js             # Models export
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   └── chats.js             # Chat and message routes
├── index.js                 # Main server file
└── package.json
```

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── Auth/                # Login & Registration
│   ├── Chat/                # Chat interface
│   ├── Layout/              # Layout components
│   ├── MemberManagement/    # User management
│   ├── Settings/            # Settings page
│   ├── UI/                  # Reusable UI components
│   └── UserRequests/        # User approval interface
├── context/
│   └── AppContext.tsx       # Global state management
├── services/
│   └── dataService.ts       # API communication
├── types/
│   └── index.ts             # TypeScript definitions
└── main.tsx                 # Application entry point
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the server directory:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

### Frontend Setup

1. **Navigate to project root:**
   ```bash
   cd ..
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🔐 Default Admin Account

After starting the server, create an admin account by visiting:
```
POST http://localhost:3000/api/auth/create-admin
```

**Default credentials:**
- Email: `admin@app.com`
- Password: `admin123`

⚠️ **Important:** Change these credentials in production!

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/create-admin` - Create admin account

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Manager only)
- `PATCH /api/users/:id/role` - Update user role (Manager only)

### Pending Users
- `GET /api/users/pending/list` - Get pending users (Manager only)
- `POST /api/users/pending/:id/approve` - Approve user (Manager only)
- `POST /api/users/pending/:id/reject` - Reject user (Manager only)

### Chats & Messages
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message
- `PUT /api/chats/:chatId/messages/:messageId` - Update message (reactions)

### User Settings
- `GET /api/users/:id/settings` - Get user settings
- `PUT /api/users/:id/settings` - Update user settings

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password hashing** with bcryptjs
- **Input validation** with express-validator
- **Rate limiting** to prevent abuse
- **CORS protection** with configurable origins
- **Helmet.js** for security headers
- **Role-based access control**
- **MongoDB injection protection**

## 🏃‍♂️ Development

### Code Organization
- **Modular architecture** with separated concerns
- **TypeScript** for type safety
- **ESLint & Prettier** for code formatting
- **Clean API design** with consistent response formats
- **Error handling** with proper HTTP status codes

### Database Models
All models include:
- Automatic timestamps
- Input validation
- Proper indexing for performance
- JSON transformation for clean API responses

### Real-time Features
- **Socket.IO** for real-time communication
- **Authentication** for socket connections
- **Room management** for chat isolation
- **Event handling** for messages, typing, and status updates

## 🚀 Production Deployment

### Environment Variables
Set these environment variables for production:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-super-secure-production-secret
FRONTEND_URL=https://your-domain.com
```

### Security Checklist
- [ ] Change default admin credentials
- [ ] Use strong JWT secret
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB authentication
- [ ] Enable HTTPS
- [ ] Configure proper rate limiting
- [ ] Set up monitoring and logging

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use (EADDRINUSE)**
   ```bash
   # Kill processes on port 3000
   npx kill-port 3000
   ```

2. **MongoDB connection issues**
   - Ensure MongoDB is running
   - Check connection string
   - Verify network access

3. **Authentication errors**
   - Clear localStorage in browser
   - Check JWT secret configuration
   - Verify token expiration

4. **Socket.IO connection issues**
   - Check CORS configuration
   - Verify token in socket authentication
   - Check network connectivity

### Development Commands

```bash
# Server development
cd server && npm run dev

# Frontend development  
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 API Response Format

All API responses follow this consistent format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "details": ["Validation error details"]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository. 