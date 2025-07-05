import axios, { AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { User, Chat, Message, PendingUser, UserSettings } from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.io instance
let socket: Socket | null = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Only clear session if it's not the login endpoint
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Don't force redirect, let the app handle it naturally
        toast.error('Session expired. Please login again.');
      }
    } else if (error.response?.status === 403) {
      toast.error('Access denied.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.data?.error) {
      // Don't show toast for login errors, let the component handle it
      if (!error.config?.url?.includes('/auth/login')) {
        toast.error(error.response.data.error);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.');
    } else if (!error.config?.url?.includes('/auth/login')) {
      // Don't show generic error for login attempts
      toast.error('Something went wrong. Please try again.');
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle async operations with toast
const withToast = async <T>(
  operation: () => Promise<T>,
  loadingMessage?: string,
  successMessage?: string,
  errorMessage?: string
): Promise<T> => {
  const toastId = loadingMessage ? toast.loading(loadingMessage) : null;
  
  try {
    const result = await operation();
    
    if (toastId) {
      toast.dismiss(toastId);
      if (successMessage) {
        toast.success(successMessage);
      }
    }
    
    return result;
  } catch (error: any) {
    if (toastId) {
      toast.dismiss(toastId);
    }
    
    if (errorMessage) {
      toast.error(errorMessage);
    }
    
    throw error;
  }
};

// ==================== SOCKET FUNCTIONS ====================

export const connectSocket = (userId: string): Promise<Socket> => {
  return new Promise((resolve, reject) => {
    try {
      if (socket && socket.connected) {
        console.log('Socket already connected');
        resolve(socket);
        return;
      }

      const token = getStoredToken();
      if (!token) {
        reject(new Error('No token available'));
        return;
      }

      socket = io(API_BASE_URL.replace('/api', ''), {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        
        // Join user room for personal notifications
        if (socket) {
          socket.emit('join-user', userId);
          resolve(socket);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      socket.on('receive-message', (message) => {
        console.log('📨 Received message via socket:', message);
      });

      socket.on('messageUpdated', (message) => {
        console.log('📝 Message updated via socket:', message);
      });

      socket.on('messageDeleted', (data) => {
        console.log('🗑️ Message deleted via socket:', data);
      });

    } catch (error) {
      console.error('Socket connection failed:', error);
      reject(error);
    }
  });
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected');
  }
};

export const getSocket = (): Socket | null => socket;

export const joinChat = (chatId: string): void => {
  if (socket?.connected) {
    socket.emit('join-chat', chatId);
    console.log(`📥 Joined chat: ${chatId}`);
  }
};

export const leaveChat = (chatId: string): void => {
  if (socket?.connected) {
    socket.emit('leave-chat', chatId);
    console.log(`📤 Left chat: ${chatId}`);
  }
};

export const emitTyping = (chatId: string, userId: string, userName: string, isTyping: boolean): void => {
  if (socket?.connected) {
    socket.emit('typing', { chatId, userId, userName, isTyping });
  }
};

export const emitStartTyping = (chatId: string, userName: string): void => {
  if (socket?.connected) {
    socket.emit('typing', { chatId, userName });
  }
};

export const emitStopTyping = (chatId: string): void => {
  if (socket?.connected) {
    socket.emit('stop-typing', { chatId });
  }
};

// ==================== AUTHENTICATION ====================

export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  const response = await api.post('/auth/login', { email, password });
  const { user, token } = response.data;
  
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Connect socket after successful login
  try {
    await connectSocket(user.id);
  } catch (error) {
    console.warn('Failed to connect socket during login:', error);
  }
  
  return { user, token };
};

export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  isManager?: boolean;
}): Promise<{ message: string }> => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error: any) {
    // Re-throw the error with proper structure for the frontend to handle
    if (error.response?.data?.error) {
      const apiError = new Error(error.response.data.error);
      (apiError as any).response = error.response;
      throw apiError;
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  return withToast(
    async () => {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      disconnectSocket();
    },
    'Logging out...',
    'Goodbye!',
    undefined
  );
};

export const createAdmin = async (): Promise<{ message: string; credentials: any }> => {
  return withToast(
    async () => {
      const response = await api.post('/auth/create-admin');
      return response.data;
    },
    'Creating admin account...',
    'Admin account created!',
    'Failed to create admin'
  );
};

// ==================== USER MANAGEMENT ====================

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me');
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  // Ensure we return an array even if the response format is different
  const data = response.data;
  if (data && data.success && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    console.warn('Unexpected users response format:', data);
    return [];
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  return withToast(
    async () => {
      const response = await api.put(`/users/${userId}`, updates);
      return response.data;
    },
    'Updating user...',
    'User updated successfully!',
    'Failed to update user'
  );
};

export const updateUserRole = async (userId: string, role: 'manager' | 'employee'): Promise<User> => {
  return withToast(
    async () => {
      const response = await api.patch(`/users/${userId}/role`, { role });
      return response.data.data;
    },
    'Updating user role...',
    'User role updated successfully!',
    'Failed to update user role'
  );
};

export const deleteUser = async (userId: string): Promise<void> => {
  return withToast(
    async () => {
      await api.delete(`/users/${userId}`);
    },
    'Deleting user...',
    'User deleted successfully!',
    'Failed to delete user'
  );
};

// ==================== PENDING USERS ====================

export const getPendingUsers = async (): Promise<PendingUser[]> => {
  const response = await api.get('/pending-users');
  return response.data;
};

export const approveUser = async (userId: string): Promise<void> => {
  return withToast(
    async () => {
      await api.post(`/pending-users/${userId}/approve`);
    },
    'Approving user...',
    'User approved successfully!',
    'Failed to approve user'
  );
};

export const rejectUser = async (userId: string): Promise<void> => {
  return withToast(
    async () => {
      await api.post(`/pending-users/${userId}/reject`);
    },
    'Rejecting user...',
    'User rejected successfully!',
    'Failed to reject user'
  );
};

// ==================== CHAT MANAGEMENT ====================

export const getChats = async (): Promise<Chat[]> => {
  const response = await api.get('/chats');
  // Ensure we return an array even if the response format is different
  const data = response.data;
  if (data && data.success && Array.isArray(data.data)) {
    return data.data;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    console.warn('Unexpected chats response format:', data);
    return [];
  }
};

export const getChat = async (chatId: string): Promise<Chat> => {
  const response = await api.get(`/chats/${chatId}`);
  return response.data;
};

export const createChat = async (chatData: {
  name: string;
  type: 'direct' | 'group';
  participants: string[];
}): Promise<Chat> => {
  return withToast(
    async () => {
      const response = await api.post('/chats', chatData);
      return response.data;
    },
    'Creating chat...',
    'Chat created successfully!',
    'Failed to create chat'
  );
};

export const createDirectChat = async (otherUserId: string, otherUserName: string): Promise<Chat> => {
  return createChat({
    name: `Chat with ${otherUserName}`,
    type: 'direct',
    participants: [otherUserId]
  });
};

export const createGroupChat = async (name: string, participants: string[]): Promise<Chat> => {
  return createChat({
    name,
    type: 'group',
    participants
  });
};

// ==================== MESSAGE MANAGEMENT ====================

export const getMessages = async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
  const response = await api.get(`/messages/${chatId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const sendMessage = async (messageData: {
  chatId: string;
  content: string;
  type?: 'text' | 'file' | 'announcement';
  isUrgent?: boolean;
  replyTo?: string;
}): Promise<Message> => {
  const response = await api.post('/messages', messageData);
  return response.data;
};

export const editMessage = async (chatId: string, messageId: string, content: string): Promise<Message> => {
  const response = await api.put(`/chats/${chatId}/messages/${messageId}`, { content });
  return response.data.data;
};

export const deleteMessage = async (chatId: string, messageId: string): Promise<{ messageId: string, chatId: string }> => {
  const response = await api.delete(`/chats/${chatId}/messages/${messageId}`);
  return response.data.data;
};

export const markMessagesAsRead = async (chatId: string, messageIds: string[]): Promise<void> => {
  await api.post(`/chats/${chatId}/messages/read`, { messageIds });
};

export const getLinkMetadata = async (url: string): Promise<any> => {
  const response = await api.post('/utils/extract-metadata', { url });
  return response.data.data;
};

export const addReaction = async (messageId: string, emoji: string): Promise<{ reactions: any[] }> => {
  const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

export const searchMessages = async (query: string): Promise<any[]> => {
  if (!query) return [];
  const response = await api.get(`/search/messages?query=${encodeURIComponent(query)}`);
  return response.data.data;
};

// ==================== FILE UPLOAD ====================

export const uploadFile = async (file: File): Promise<{
  message: string;
  file: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
}> => {
  return withToast(
    async () => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    },
    'Uploading file...',
    'File uploaded successfully!',
    'Failed to upload file'
  );
};

export const uploadMultipleFiles = async (files: File[]): Promise<{
  message: string;
  files: Array<{
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }>;
}> => {
  return withToast(
    async () => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await api.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    },
    'Uploading files...',
    'Files uploaded successfully!',
    'Failed to upload files'
  );
};

export const deleteFile = async (filename: string): Promise<void> => {
  return withToast(
    async () => {
      await api.delete(`/upload/${filename}`);
    },
    'Deleting file...',
    'File deleted successfully!',
    'Failed to delete file'
  );
};

export const sendMessageWithFile = async (messageData: {
  chatId: string;
  content: string;
  file: File;
}): Promise<Message> => {
  return withToast(
    async () => {
      // First upload the file
      const uploadResponse = await uploadFile(messageData.file);
      
      // Then send the message with file info
      const response = await api.post('/messages', {
        chatId: messageData.chatId,
        content: messageData.content,
        type: 'file',
        fileUrl: uploadResponse.file.url,
        fileName: uploadResponse.file.originalName,
        fileType: uploadResponse.file.mimetype
      });
      
      return response.data;
    },
    'Sending file...',
    'File sent successfully!',
    'Failed to send file'
  );
};

// ==================== USER SETTINGS ====================

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await api.get('/user-settings');
  return response.data;
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  return withToast(
    async () => {
      const response = await api.put('/user-settings', settings);
      return response.data;
    },
    'Updating settings...',
    'Settings updated successfully!',
    'Failed to update settings'
  );
};

// ==================== MOCK DATA FOR DEVELOPMENT ====================

export const mockData = {
  // General chat - available for all users
  generalChat: {
    id: 'general-chat-id',
    name: 'General Chat',
    type: 'general' as const,
    participants: [],
    lastMessage: {
      content: 'Welcome to the general chat!',
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Announcements chat - manager only can post, all can read
  announcementsChat: {
    id: 'announcements-chat-id',
    name: 'Announcements',
    type: 'announcements' as const,
    participants: [],
    lastMessage: {
      content: 'Important announcements will be posted here',
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// ==================== UTILITY FUNCTIONS ====================

export const isUserOnline = (user: User): boolean => {
  return user.status === 'online';
};

export const formatLastSeen = (lastSeen: Date | string): string => {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const getChatDisplayName = (chat: Chat, currentUserId: string, users: User[]): string => {
  if (chat.type === 'general') return 'General Chat';
  if (chat.type === 'announcements') return 'Announcements';
  if (chat.type === 'group') return chat.name;
  
  // For direct chats, show the other user's name
  if (chat.type === 'direct') {
    const otherUserId = chat.participants.find(id => id !== currentUserId);
    const otherUser = users.find(user => user.id === otherUserId);
    return otherUser ? otherUser.name : 'Unknown User';
  }
  
  return chat.name;
};

export const getChatDisplayAvatar = (chat: Chat, currentUserId: string, users: User[]): string => {
  if (chat.type === 'general') return '💬';
  if (chat.type === 'announcements') return '📢';
  if (chat.type === 'group') return '👥';
  
  // For direct chats, show the other user's avatar
  if (chat.type === 'direct') {
    const otherUserId = chat.participants.find(id => id !== currentUserId);
    const otherUser = users.find(user => user.id === otherUserId);
    return otherUser ? (otherUser.avatar || '👤') : '👤';
  }
  
  return '💬';
};

// ==================== ERROR HANDLING ====================

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// ==================== LOCAL STORAGE HELPERS ====================

export const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!(getStoredToken() && getStoredUser());
};

// ==================== HEALTH CHECK ====================

export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${getStoredToken()}`
      },
      timeout: 5000
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

// ==================== INITIALIZATION ====================

export const initializeDataService = async (): Promise<void> => {
  try {
    const user = getStoredUser();
    const token = getStoredToken();
    
    if (user && token) {
      // Verify token is still valid
      const isValid = await healthCheck();
      if (isValid) {
        await connectSocket(user.id);
        console.log('✅ DataService initialized successfully');
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('❌ Invalid token, cleared storage');
      }
    }
  } catch (error) {
    console.error('DataService initialization failed:', error);
  }
};

// Auto-initialize on import
initializeDataService();

// Add this new function for avatar upload
export const uploadAvatar = async (file: File): Promise<User> => {
  return withToast(
    async () => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    },
    'Uploading avatar...',
    'Avatar uploaded successfully!',
    'Failed to upload avatar'
  );
};

// Combined function for updating user profile (name and avatar)
export const updateUserProfile = async (userId: string, name: string, avatarFile: File | null): Promise<User> => {
  return withToast(
    async () => {
      let updatedUser: User;
      
      // Upload avatar if provided
      if (avatarFile) {
        updatedUser = await uploadAvatar(avatarFile);
      } else {
        // Just get current user data
        updatedUser = await getCurrentUser();
      }
      
      // Update name if it's different
      if (name !== updatedUser.name) {
        updatedUser = await updateUser(userId, { name });
      }
      
      return updatedUser;
    },
    'Updating profile...',
    'Profile updated successfully!',
    'Failed to update profile'
  );
};

// --- MANAGER-ONLY CHAT FUNCTIONS ---

export const getDirectChatsForOversight = async (): Promise<Chat[]> => {
  const response = await api.get('/chats/oversee/direct');
  return response.data.data;
};

export const getMessagesForOversight = async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
  const response = await api.get(`/chats/oversee/${chatId}/messages?page=${page}&limit=${limit}`);
  return response.data.data;
};

// ==================== STATS FUNCTIONS ====================
export const getDashboardStats = async (): Promise<any> => {
  const response = await api.get('/stats/dashboard');
  return response.data.data;
};

export const getAuditLogs = async (page = 1, limit = 20): Promise<any> => {
  const response = await api.get(`/stats/audit-logs?page=${page}&limit=${limit}`);
  return response.data;
};

export const sendBroadcast = async (message: string): Promise<void> => {
  await api.post('/broadcasts/send', { message });
};

export const deleteChat = async (chatId: string): Promise<void> => {
  return withToast(
    async () => {
      await api.delete(`/chats/${chatId}`);
    },
    'Deleting chat...',
    'Chat deleted successfully!',
    'Failed to delete chat'
  );
};

export const clearChatMessages = async (chatId: string): Promise<{ deletedCount: number }> => {
  return withToast(
    async () => {
      const response = await api.delete(`/chats/${chatId}/messages`);
      return response.data;
    },
    'Clearing chat messages...',
    'Chat messages cleared successfully!',
    'Failed to clear chat messages'
  );
};

export default {
  // Auth
  login,
  register,
  logout,
  createAdmin,
  
  // Users
  getCurrentUser,
  getUsers,
  updateUser,
  updateUserRole,
  deleteUser,
  
  // Pending Users
  getPendingUsers,
  approveUser,
  rejectUser,
  
  // Chats
  getChats,
  getChat,
  createChat,
  createDirectChat,
  createGroupChat,
  
  // Messages
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  addReaction,
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  sendMessageWithFile,
  
  // Settings
  getUserSettings,
  updateUserSettings,
  
  // Socket
  connectSocket,
  disconnectSocket,
  getSocket,
  joinChat,
  leaveChat,
  emitTyping,
  
  // Utilities
  isUserOnline,
  formatLastSeen,
  getChatDisplayName,
  getChatDisplayAvatar,
  handleApiError,
  getStoredUser,
  getStoredToken,
  isAuthenticated,
  healthCheck,
  initializeDataService,
  
  // Mock data
  mockData,
  
  // New function
  uploadAvatar,
  
  // Manager-only functions
  getDirectChatsForOversight,
  getMessagesForOversight,
  
  // New function
  getLinkMetadata,
  
  // New function
  searchMessages,
  
  // New function
  getDashboardStats,
  
  // New function
  getAuditLogs,
  
  // New function
  sendBroadcast,
  
  // New function
  deleteChat,
  
  // New function
  clearChatMessages,
  
  // New function
  updateUserProfile
};