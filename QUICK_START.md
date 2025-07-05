# 🚀 Quick Start Guide

Get the IIB Chat Application up and running in minutes!

## Prerequisites

- ✅ Node.js (v16+)
- ✅ MongoDB (v4.4+)
- ✅ Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iib-chat-application
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd server
   npm install
   cd ..
   ```

3. **Start MongoDB**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

4. **Run the application**
   ```bash
   # Development mode (recommended)
   .\start-app.ps1
   
   # Or production mode
   .\start-app-production.ps1
   ```

## 🎯 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Admin Login**: admin@iibchat.com / Admin123

## 🔧 Manual Start (Alternative)

If the scripts don't work:

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
npm run dev
```

## 🐛 Common Issues

### MongoDB not running
```bash
# Check if MongoDB is running
netstat -an | findstr :27017

# Start MongoDB service
net start MongoDB
```

### Port already in use
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Clear cache
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🎉 You're Ready!

The application should now be running. You can:

1. **Login as admin** with the default credentials
2. **Register new users** (requires admin approval)
3. **Start chatting** in real-time
4. **Manage users** from the admin dashboard

Need help? Check the full [README.md](README.md) or open an issue! 