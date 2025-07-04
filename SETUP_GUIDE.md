# IIB Chat Application - Setup Guide

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
3. **Git** - [Download](https://git-scm.com/)

## Quick Start

### Option 1: Using the PowerShell Script (Recommended for Windows)

```powershell
# Run the start script
.\start-app.ps1
```

This script will:
- Check if MongoDB is running
- Start the backend server
- Start the frontend development server
- Open two PowerShell windows for monitoring

### Option 2: Manual Setup

#### Step 1: Install MongoDB (if not already installed)

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. MongoDB should start automatically as a Windows service

**To verify MongoDB is running:**
```powershell
# Check if MongoDB is running on port 27017
Test-NetConnection -ComputerName localhost -Port 27017
```

#### Step 2: Install Dependencies

```powershell
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

#### Step 3: Start the Application

**Option A: Start both servers in separate terminals**

Terminal 1 - Backend:
```powershell
cd server
npm start
```

Terminal 2 - Frontend:
```powershell
npm run dev
```

**Option B: Use the provided script**
```powershell
.\start-app.ps1
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health

## Default Credentials

### Admin Account
- **Email**: admin@iibchat.com
- **Password**: admin123

### Test User Account
- **Email**: user@iibchat.com
- **Password**: user123

## Troubleshooting

### MongoDB Connection Issues

If you see "MongoDB connection error" in the console:

1. **Ensure MongoDB is installed and running:**
   ```powershell
   # Windows - Start MongoDB service
   net start MongoDB
   ```

2. **Alternative: Use MongoDB Atlas (Cloud)**
   - Create a free account at https://www.mongodb.com/cloud/atlas
   - Create a cluster
   - Get your connection string
   - Update `server/.env` file with your connection string

### Port Already in Use

If you see "EADDRINUSE" error:

```powershell
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Authentication Issues

If you can't log in:

1. Clear browser localStorage:
   - Open browser DevTools (F12)
   - Go to Application/Storage tab
   - Clear Local Storage

2. Create admin account:
   ```powershell
   cd server
   node create-admin.cjs
   ```

## Features Overview

- **Real-time Chat**: Instant messaging with Socket.IO
- **User Management**: Registration approval system
- **File Sharing**: Upload images and documents
- **Multi-language**: Arabic and English support
- **Dark Mode**: Toggle between light and dark themes
- **Notifications**: Browser notifications for new messages
- **Search**: Search messages and users
- **Admin Dashboard**: User and chat management

## Development Tips

1. **Watch for file changes**: Both frontend and backend support hot-reloading
2. **Check logs**: Monitor both terminal windows for errors
3. **API Testing**: Use tools like Postman or Thunder Client
4. **Database GUI**: Use MongoDB Compass to view/edit data

## Common Commands

```powershell
# Start development servers
npm run dev          # Frontend only
npm run start:server # Backend only

# Build for production
npm run build

# Run linting
npm run lint

# Create admin user
cd server && node create-admin.cjs
```

## Need Help?

1. Check the console logs in both terminal windows
2. Verify MongoDB is running
3. Ensure all dependencies are installed
4. Check the `.env` file exists in the server directory
5. Try clearing browser cache and localStorage

## Next Steps

After successfully running the application:

1. Create an admin account
2. Log in and explore the features
3. Approve pending user registrations
4. Start chatting!

---

For more detailed documentation, see:
- [README.md](README.md) - Project overview
- [REQUIREMENTS.md](REQUIREMENTS.md) - Technical requirements
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration 