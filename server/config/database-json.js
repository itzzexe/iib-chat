const fs = require('fs');
const path = require('path');

// JSON database file paths
const DB_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const CHATS_FILE = path.join(DB_DIR, 'chats.json');
const MESSAGES_FILE = path.join(DB_DIR, 'messages.json');
const PENDING_USERS_FILE = path.join(DB_DIR, 'pending-users.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initFile = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

// Initialize all database files
initFile(USERS_FILE, []);
initFile(CHATS_FILE, [
  {
    id: 'general-chat',
    name: 'General Chat',
    type: 'general',
    participants: [],
    description: 'General discussion for all team members',
    createdAt: new Date().toISOString()
  },
  {
    id: 'announcements-chat',
    name: 'Announcements',
    type: 'announcements',
    participants: [],
    description: 'Important announcements from management',
    createdAt: new Date().toISOString()
  }
]);
initFile(MESSAGES_FILE, []);
initFile(PENDING_USERS_FILE, []);

// Helper functions
const readJSON = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// Database operations
const db = {
  // Users
  users: {
    findAll: () => readJSON(USERS_FILE),
    findById: (id) => readJSON(USERS_FILE).find(u => u.id === id),
    findByEmail: (email) => readJSON(USERS_FILE).find(u => u.email === email),
    create: (user) => {
      const users = readJSON(USERS_FILE);
      const newUser = { ...user, id: Date.now().toString(), createdAt: new Date().toISOString() };
      users.push(newUser);
      writeJSON(USERS_FILE, users);
      return newUser;
    },
    update: (id, updates) => {
      const users = readJSON(USERS_FILE);
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        writeJSON(USERS_FILE, users);
        return users[index];
      }
      return null;
    },
    delete: (id) => {
      const users = readJSON(USERS_FILE);
      const filtered = users.filter(u => u.id !== id);
      writeJSON(USERS_FILE, filtered);
      return filtered.length < users.length;
    }
  },

  // Chats
  chats: {
    findAll: () => readJSON(CHATS_FILE),
    findById: (id) => readJSON(CHATS_FILE).find(c => c.id === id),
    create: (chat) => {
      const chats = readJSON(CHATS_FILE);
      const newChat = { ...chat, id: Date.now().toString(), createdAt: new Date().toISOString() };
      chats.push(newChat);
      writeJSON(CHATS_FILE, chats);
      return newChat;
    },
    update: (id, updates) => {
      const chats = readJSON(CHATS_FILE);
      const index = chats.findIndex(c => c.id === id);
      if (index !== -1) {
        chats[index] = { ...chats[index], ...updates };
        writeJSON(CHATS_FILE, chats);
        return chats[index];
      }
      return null;
    }
  },

  // Messages
  messages: {
    findAll: () => readJSON(MESSAGES_FILE),
    findByChatId: (chatId) => readJSON(MESSAGES_FILE).filter(m => m.chatId === chatId),
    create: (message) => {
      const messages = readJSON(MESSAGES_FILE);
      const newMessage = { ...message, id: Date.now().toString(), timestamp: new Date().toISOString() };
      messages.push(newMessage);
      writeJSON(MESSAGES_FILE, messages);
      return newMessage;
    },
    update: (id, updates) => {
      const messages = readJSON(MESSAGES_FILE);
      const index = messages.findIndex(m => m.id === id);
      if (index !== -1) {
        messages[index] = { ...messages[index], ...updates };
        writeJSON(MESSAGES_FILE, messages);
        return messages[index];
      }
      return null;
    }
  },

  // Pending Users
  pendingUsers: {
    findAll: () => readJSON(PENDING_USERS_FILE),
    create: (user) => {
      const pendingUsers = readJSON(PENDING_USERS_FILE);
      const newUser = { ...user, id: Date.now().toString(), createdAt: new Date().toISOString() };
      pendingUsers.push(newUser);
      writeJSON(PENDING_USERS_FILE, pendingUsers);
      return newUser;
    },
    delete: (id) => {
      const pendingUsers = readJSON(PENDING_USERS_FILE);
      const filtered = pendingUsers.filter(u => u.id !== id);
      writeJSON(PENDING_USERS_FILE, filtered);
      return filtered.length < pendingUsers.length;
    }
  }
};

module.exports = db; 