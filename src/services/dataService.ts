import axios, { AxiosResponse } from 'axios';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { User, Chat, Message, PendingUser, UserSettings, CallHistory } from '../types';
import { logger } from '../utils/logger';

// API Configuration - Get the current hostname for external access
const getCurrentHost = () => {
  // If running on localhost, use localhost, otherwise use the current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = '3000';
    
    // For external access, we need to use the server's actual IP
    // This will be the IP address of the machine running the server
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.endsWith('loca.lt')) {
      // For production or when backend is exposed on the same domain
      return `http://${hostname}:${port}`;
    }
    
    // Use local backend for development, including localtunnel
    return `http://localhost:${port}`;
  }
  return 'http://localhost:3000';
};

const SERVER_BASE_URL = getCurrentHost();
const API_BASE_URL = `${SERVER_BASE_URL}/api`;
const SOCKET_URL = SERVER_BASE_URL;

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
    logger.error('Request interceptor error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    logger.error('API Error', { 
      url: error.config?.url, 
      method: error.config?.method,
      status: error.response?.status,
      message: error.message 
    });
    
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
        logger.socket('Socket already connected');
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
        forceNew: true,
        // Add additional security headers
        extraHeaders: {
          'Authorization': `Bearer ${token}`
        }
      });

      socket.on('connect', () => {
        logger.socket('Socket connected successfully', { socketId: socket?.id });
        
        // Join user room for personal notifications - server will validate this
        if (socket) {
          socket.emit('join-user', userId);
          resolve(socket);
        }
      });

      socket.on('connect_error', (error) => {
        logger.error('Socket connection error', { error: error.message });
        // Handle authentication errors specifically
        if (error.message.includes('Authentication error')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Authentication failed. Please login again.');
        }
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        logger.socket('Socket disconnected', { reason });
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        // Handle authentication errors
        if (error.toString().includes('Authentication')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please login again.');
        }
      });

      socket.on('receive-message', (message) => {
        logger.socket('Received message via socket', { messageId: message.id, chatId: message.chatId });
      });

      socket.on('messageUpdated', (message) => {
        logger.socket('Message updated via socket', { messageId: message.id, chatId: message.chatId });
      });

      socket.on('messageDeleted', (data) => {
        logger.socket('Message deleted via socket', { messageId: data.messageId, chatId: data.chatId });
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
    logger.socket('Socket disconnected');
  }
};

export const getSocket = (): Socket | null => socket;

export const joinChat = (chatId: string): void => {
  if (socket?.connected) {
    socket.emit('join-chat', chatId);
    logger.socket('Joined chat', { chatId });
  }
};

export const leaveChat = (chatId: string): void => {
  if (socket?.connected) {
    socket.emit('leave-chat', chatId);
    logger.socket('Left chat', { chatId });
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
  
  // Process user data to fix avatar URL
  const processedUser = processUserData(user);
  
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(processedUser));
  
  // Connect socket after successful login
  try {
    await connectSocket(processedUser.id);
  } catch (error) {
    console.warn('Failed to connect socket during login:', error);
  }
  
  return { user: processedUser, token };
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

// Removed createAdmin function for security reasons
// Admin accounts should be created through secure server initialization

// Helper function to process user data - always return undefined for avatar to force initials
const processUserData = (user: any): User => {
  return {
    ...user,
    role: user.role || (user.isManager ? 'manager' : 'employee'), // Map isManager to role if needed
    avatar: undefined // Always use initials instead of images
  };
};

// ==================== USER MANAGEMENT ====================

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/users/me');
  return processUserData(response.data);
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  // Ensure we return an array even if the response format is different
  const data = response.data;
  let users: any[] = [];
  
  if (data && data.success && Array.isArray(data.data)) {
    users = data.data;
  } else if (Array.isArray(data)) {
    users = data;
  } else {
    console.warn('Unexpected users response format:', data);
    return [];
  }
  
  // Process all users to fix avatar URLs
  return users.map(processUserData);
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User> => {
  return withToast(
    async () => {
      const response = await api.put(`/users/${userId}`, updates);
      return processUserData(response.data);
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
  const user = getStoredUser();
  if (!user) throw new Error('No user found');
  const response = await api.get(`/users/${user.id}/settings`);
  return response.data.data;
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const user = getStoredUser();
  if (!user) throw new Error('No user found');
  const response = await api.put(`/users/${user.id}/settings`, settings);
  return response.data.data;
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
    if (userStr) {
      const user = JSON.parse(userStr);
      // Process the user data to fix avatar URL
      return processUserData(user);
    }
    return null;
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
    const token = getStoredToken();
    if (!token) return false;
    
    const response = await api.get('/users/me', {
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
        logger.info('DataService initialized successfully');
      } else {
        // Token is invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        logger.warn('Invalid token, cleared storage');
      }
    }
  } catch (error) {
    console.error('DataService initialization failed:', error);
  }
};

// Auto-initialize on import (only in browser)
if (typeof window !== 'undefined') {
  initializeDataService();
}

// Add this new function for avatar upload
export const uploadAvatar = async (file: File): Promise<User> => {
  return withToast(
    async () => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.put('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const updatedUser = processUserData(response.data.data);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
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

export const createSampleAuditLogs = async (): Promise<void> => {
  await api.post('/stats/create-sample-logs');
};

export const clearAuditLogs = async (): Promise<void> => {
  await api.delete('/stats/clear-audit-logs');
};

// ==================== TASK MANAGEMENT ====================

export const getTasks = async (): Promise<any> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get('/tasks');
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Failed to fetch tasks (attempt ${attempt}/${maxRetries}):`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const getTask = async (taskId: string): Promise<any> => {
  try {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch task:', error);
    throw error;
  }
};

export const createTask = async (taskData: any): Promise<any> => {
  try {
    const response = await api.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, taskData: any): Promise<any> => {
  try {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await api.delete(`/tasks/${taskId}`);
  } catch (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
};

export const addTaskComment = async (taskId: string, content: string): Promise<any> => {
  try {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  } catch (error) {
    console.error('Failed to add task comment:', error);
    throw error;
  }
};

export const getCalendarEvents = async (start?: string, end?: string): Promise<any> => {
  try {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    
    const response = await api.get(`/tasks/calendar/events?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    throw error;
  }
};

// ==================== TEAM MANAGEMENT ====================

export const getTeams = async (): Promise<any> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get('/teams');
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Failed to fetch teams (attempt ${attempt}/${maxRetries}):`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const getTeam = async (teamId: string): Promise<any> => {
  try {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch team:', error);
    throw error;
  }
};

export const removeTeamMember = async (teamId: string, userId: string): Promise<any> => {
  try {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to remove team member:', error);
    throw error;
  }
};

export const createTeam = async (teamData: any): Promise<any> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.post('/teams', teamData);
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Failed to create team (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const updateTeam = async (teamId: string, teamData: any): Promise<any> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.put(`/teams/${teamId}`, teamData);
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Failed to update team (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await api.delete(`/teams/${teamId}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Failed to delete team (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const addTeamMember = async (teamId: string, userId: string, role: string = 'member'): Promise<any> => {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.post(`/teams/${teamId}/members`, { userId, role });
      return response.data;
    } catch (error) {
      lastError = error;
      console.error(`Failed to add team member (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// ==================== CALL HISTORY ====================

export const getCallHistory = async (): Promise<CallHistory[]> => {
  try {
    const response = await api.get('/calls/history');
    return response.data.map((call: any) => ({
      ...call,
      startTime: new Date(call.startTime),
      endTime: call.endTime ? new Date(call.endTime) : undefined
    }));
  } catch (error) {
    console.error('Failed to fetch call history:', error);
    throw error;
  }
};

export const saveCallRecord = async (callData: Omit<CallHistory, 'id'>): Promise<CallHistory> => {
  try {
    const response = await api.post('/calls/history', callData);
    return {
      ...response.data,
      startTime: new Date(response.data.startTime),
      endTime: response.data.endTime ? new Date(response.data.endTime) : undefined
    };
  } catch (error: any) {
    // Don't log duplicate key errors as they're expected
    if (error.response?.status !== 409) {
      console.error('Failed to save call record:', error);
    }
    throw error;
  }
};

export const deleteCallRecord = async (callId: string): Promise<void> => {
  try {
    await api.delete(`/calls/history/${callId}`);
  } catch (error) {
    console.error('Failed to delete call record:', error);
    throw error;
  }
};

// ==================== BROADCAST & CHAT MANAGEMENT ====================

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

// Export functions for dataService
export default {
  // Socket functions
  connectSocket,
  disconnectSocket,
  getSocket,
  joinChat,
  leaveChat,
  emitTyping,
  emitStartTyping,
  emitStopTyping,

  // Auth functions
  login,
  register,
  logout,
  getCurrentUser,
  
  // User functions
  getUsers,
  updateUser,
  updateUserRole,
  deleteUser,
  getPendingUsers,
  approveUser,
  rejectUser,
  uploadAvatar,
  updateUserProfile,
  
  // Chat functions
  getChats,
  getChat,
  createChat,
  createDirectChat,
  createGroupChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  getDirectChatsForOversight,
  getMessagesForOversight,
  
  // File functions
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  sendMessageWithFile,
  
  // Settings functions
  getUserSettings,
  updateUserSettings,
  
  // Utility functions
  getLinkMetadata,
  addReaction,
  searchMessages,
  healthCheck,
  initializeDataService,
  
  // Stats functions
  getDashboardStats,
  getAuditLogs,
  createSampleAuditLogs,
  clearAuditLogs,
  
  // Task functions
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
  getCalendarEvents,
  
  // Team functions
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  
  // Call functions
  getCallHistory,
  saveCallRecord,
  deleteCallRecord,
  
  // Broadcast functions
  sendBroadcast,
  
  // Chat management functions
  deleteChat,
  clearChatMessages,
  
  // Helper functions
  isUserOnline,
  formatLastSeen,
  getChatDisplayName,
  getChatDisplayAvatar,
  handleApiError,
  getStoredUser,
  getStoredToken,
  isAuthenticated
};



