import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { AppState, User, Chat, Message, PendingUser, UserSettings, FileUpload, SearchResult, BroadcastMessage, AppScreen } from '../types';
import dataService from '../services/dataService';
import { toast } from 'react-hot-toast';
import { playNotificationSound } from '../services/audioService';

const dataServiceAPI = dataService;

interface AppContextValue extends AppState {
  // Authentication
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, isManager?: boolean) => Promise<boolean>;
  
  // Chat functionality
  sendMessage: (chatId: string, content: string, type?: 'text' | 'file' | 'announcement', file?: FileUpload) => Promise<void>;
  uploadFile: (file: File) => Promise<FileUpload>;
  editMessage: (chatId: string, messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  addReaction: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  
  // Navigation
  setActiveChat: (chatId: string | null) => void;
  setCurrentScreen: (screen: AppScreen) => void;
  
  // Settings
  toggleDarkMode: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateUserProfile: (name: string, avatarFile: File | null) => Promise<void>;
  
  // Notifications
  requestNotificationPermission: () => Promise<void>;
  
  // User management
  updateUserStatus: (status: 'online' | 'offline' | 'away' | 'busy') => Promise<void>;
  searchMessages: (query: string) => void;
  archiveChat: (chatId: string) => Promise<void>;
  markChatAsRead: (chatId: string, messageIds: string[]) => Promise<void>;
  
  // Manager functions
  approvePendingUser: (userId: string) => Promise<void>;
  rejectPendingUser: (userId: string) => Promise<void>;
  getPendingUsersCount: () => number;
  
  // Member management
  updateUserRole: (userId: string, newRole: 'manager' | 'employee') => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  
  // Direct chat management
  createDirectChat: (otherUserId: string) => Promise<void>;
  
  // Modal management
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;

  // Oversight
  overseenChats: Chat[];
  overseenMessages: { [chatId: string]: Message[] };
  loadOverseenChats: () => Promise<void>;
  loadMessagesForOversight: (chatId: string) => Promise<void>;
  activeOversightChat: Chat | null;
  setActiveOversightChat: (chat: Chat | null) => void;

  // Reply functionality
  setReplyingTo: (message: Message | null) => void;
  cancelReply: () => void;
  replyingTo: Message | null;

  // Typing indicator
  typingUsers: { [chatId: string]: string[] };

  // New functionality
  markMessagesAsRead: (chatId: string, messageIds: string[]) => Promise<void>;

  // Search
  searchResults: SearchResult[];
  performSearch: (query: string) => Promise<void>;
  getChatDisplayName: (chat: Chat) => string;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

type AppAction =
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  | { type: 'ADD_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'UPDATE_MESSAGE'; payload: { chatId: string; message: Message } }
  | { type: 'REMOVE_MESSAGE'; payload: { chatId: string; messageId: string } }
  | { type: 'SET_TYPING_USERS'; payload: { chatId: string; users: string[] } }
  | { type: 'MARK_MESSAGES_READ'; payload: { chatId: string; readerId: string; messageIds: string[] } }
  | { type: 'OPEN_MODAL'; payload: React.ReactNode }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_CHATS'; payload: Chat[] }
  | { type: 'SET_MESSAGES'; payload: { [chatId: string]: Message[] } }
  | { type: 'SET_ACTIVE_CHAT'; payload: string | null }
  | { type: 'SET_PENDING_USERS'; payload: PendingUser[] }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_OVERSEEN_CHATS'; payload: Chat[] }
  | { type: 'SET_OVERSEEN_MESSAGES'; payload: { chatId: string; messages: Message[] } }
  | { type: 'SET_ACTIVE_OVERSIGHT_CHAT'; payload: Chat | null }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_CURRENT_SCREEN'; payload: AppScreen }
  | { type: 'SET_DARK_MODE'; payload: boolean }
  | { type: 'SET_USER_SETTINGS'; payload: { userId: string; settings: UserSettings } }
  | { type: 'SET_NOTIFICATION_PERMISSION'; payload: boolean }
  | { type: 'UPDATE_CHAT'; payload: Chat };

const getInitialTheme = (): boolean => {
  const saved = localStorage.getItem('iib-chat-theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const initialState: AppState = {
  loading: true,
  currentUser: null,
  users: [],
  pendingUsers: [],
  chats: [],
  messages: {},
  activeChat: null,
  currentScreen: 'chat',
  darkMode: getInitialTheme(),
  notifications: {
    enabled: true,
    granted: Notification.permission === 'granted',
    requested: Notification.permission !== 'default'
  },
  searchResults: [],
  userSettings: {},
  isModalOpen: false,
  modalContent: null,
  overseenChats: [],
  overseenMessages: {},
  activeOversightChat: null,
  typingUsers: {},
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'ADD_MESSAGE': {
      const { chatId, message } = action.payload;
      const chatMessages = state.messages[chatId] || [];
      if (chatMessages.some(m => m.id === message.id)) return state; // Avoid duplicates
      const newMessages = { ...state.messages, [chatId]: [...chatMessages, message] };
      return { ...state, messages: newMessages };
    }
    case 'UPDATE_MESSAGE': {
      const { chatId, message: updatedMessage } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: state.messages[chatId]?.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg) || []
        }
      };
    }
    case 'REMOVE_MESSAGE': {
      const { chatId, messageId } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: state.messages[chatId]?.map(msg =>
            msg.id === messageId ? { ...msg, isDeleted: true, content: 'This message was deleted.' } : msg
          ) || []
        }
      };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TYPING_USERS': {
      const { chatId, users } = action.payload;
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [chatId]: [...(state.typingUsers[chatId] || []), ...users]
        }
      };
    }
    case 'MARK_MESSAGES_READ': {
      const { chatId, readerId, messageIds } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: state.messages[chatId]?.map(msg =>
            messageIds.includes(msg.id) && !msg.readBy.some(r => r.userId === readerId)
              ? { ...msg, readBy: [...msg.readBy, { userId: readerId, readAt: new Date() }] }
              : msg
          ) || []
        }
      };
    }
    case 'OPEN_MODAL':
      return { ...state, isModalOpen: true, modalContent: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, isModalOpen: false, modalContent: null };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_CHATS':
      return { ...state, chats: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
    case 'SET_PENDING_USERS':
      return { ...state, pendingUsers: action.payload };
    case 'UPDATE_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_OVERSEEN_CHATS':
      return { ...state, overseenChats: action.payload };
    case 'SET_OVERSEEN_MESSAGES':
      return { ...state, overseenMessages: { ...state.overseenMessages, [action.payload.chatId]: action.payload.messages } };
    case 'SET_ACTIVE_OVERSIGHT_CHAT':
      return { ...state, activeOversightChat: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    case 'SET_CURRENT_SCREEN':
      return { ...state, currentScreen: action.payload };
    case 'SET_DARK_MODE':
      localStorage.setItem('iib-chat-theme', action.payload ? 'dark' : 'light');
      return { ...state, darkMode: action.payload };
    case 'SET_USER_SETTINGS':
      return { 
        ...state, 
        userSettings: { 
          ...state.userSettings, 
          [action.payload.userId]: action.payload.settings 
        } 
      };
    case 'SET_NOTIFICATION_PERMISSION':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          granted: action.payload,
          requested: true
        }
      };
    case 'UPDATE_CHAT': {
      const updatedChat = action.payload;
      return {
        ...state,
        chats: state.chats.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        )
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Refactor socket listeners to be more robust
  useEffect(() => {
    const socket = dataServiceAPI.getSocket();
    if (socket) {
      const messageHandler = (message: Message) => {
        dispatch({ type: 'ADD_MESSAGE', payload: { chatId: message.chatId!, message } });
        // Play sound if message is not from current user and window is not focused
        if (message.senderId !== state.currentUser?.id && !document.hasFocus()) {
          playNotificationSound();
        }
      };
      const updatedHandler = (message: Message) => dispatch({ type: 'UPDATE_MESSAGE', payload: { chatId: message.chatId!, message } });
      const deletedHandler = ({ messageId, chatId }: { messageId: string, chatId: string }) => dispatch({ type: 'REMOVE_MESSAGE', payload: { chatId, messageId } });
      
      const userTypingHandler = ({ chatId, userName }: { chatId: string, userName: string }) => {
        const currentUsers = state.typingUsers?.[chatId] || [];
        if (!currentUsers.includes(userName)) {
          dispatch({ type: 'SET_TYPING_USERS', payload: { chatId, users: [...currentUsers, userName] } });
        }
      };
      
      const userStopTypingHandler = ({ chatId, userName }: { chatId: string, userName: string }) => {
        const currentUsers = state.typingUsers?.[chatId] || [];
        dispatch({ type: 'SET_TYPING_USERS', payload: { chatId, users: currentUsers.filter(u => u !== userName) } });
      };

      const messagesReadHandler = (payload: { chatId: string; readerId: string; messageIds: string[] }) => {
        dispatch({ type: 'MARK_MESSAGES_READ', payload });
      };

      const broadcastHandler = (data: BroadcastMessage) => {
        dispatch({ type: 'OPEN_MODAL', payload: (
          <div className="p-4 text-center">
            <h2 className="text-xl font-bold text-red-500">Broadcast from {data.senderName}</h2>
            <p className="mt-4 text-lg">{data.message}</p>
            <button
              onClick={() => dispatch({ type: 'CLOSE_MODAL' })}
              className="mt-6 px-4 py-2 bg-primary-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        ) });
      };

      socket.on('receive-message', messageHandler);
      socket.on('messageUpdated', updatedHandler);
      socket.on('messageDeleted', deletedHandler);
      socket.on('user-typing', userTypingHandler);
      socket.on('user-stop-typing', userStopTypingHandler);
      socket.on('messagesRead', messagesReadHandler);
      socket.on('global-broadcast', broadcastHandler);

      return () => {
        socket.off('receive-message', messageHandler);
        socket.off('messageUpdated', updatedHandler);
        socket.off('messageDeleted', deletedHandler);
        socket.off('user-typing', userTypingHandler);
        socket.off('user-stop-typing', userStopTypingHandler);
        socket.off('messagesRead', messagesReadHandler);
        socket.off('global-broadcast', broadcastHandler);
      };
    }
  }, [state.currentUser, state.typingUsers]);

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Check if user is logged in (has token)
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            dispatch({ type: 'SET_CURRENT_USER', payload: user });
            
            // Load additional data
            const [users, chats] = await Promise.all([
              dataServiceAPI.getUsers(),
              dataServiceAPI.getChats()
            ]);
            
            dispatch({ type: 'SET_USERS', payload: users });
            dispatch({ type: 'SET_CHATS', payload: chats });
            
            // Add default messages for default chats
            const defaultMessages: { [chatId: string]: Message[] } = {};
            
            // Find general and announcements chats
            const generalChat = chats.find(c => c.type === 'general');
            const announcementsChat = chats.find(c => c.type === 'announcements');
            
            if (generalChat) {
              defaultMessages[generalChat.id] = [{
                id: 'welcome-general',
                senderId: 'system',
                senderName: 'System',
                content: 'Welcome to the General Chat! This is where team members can have casual conversations and share ideas.',
                timestamp: new Date(),
                type: 'text',
                reactions: [],
                readBy: []
              }];
            }
            
            if (announcementsChat) {
              defaultMessages[announcementsChat.id] = [{
                id: 'welcome-announcements',
                senderId: 'system',
                senderName: 'System',
                content: 'This is the official announcements channel. Only managers can post important updates here.',
                timestamp: new Date(),
                type: 'announcement',
                reactions: [],
                readBy: []
              }];
            }
            
            dispatch({ type: 'SET_MESSAGES', payload: defaultMessages });
            
            // Select the first chat automatically
            if (chats.length > 0 && !state.activeChat) {
              const firstChat = generalChat || chats[0];
              dispatch({ type: 'SET_ACTIVE_CHAT', payload: firstChat.id });
            }
            
            // Load pending users if manager
            if (user.role === 'manager') {
              const pendingUsers = await dataServiceAPI.getPendingUsers();
              dispatch({ type: 'SET_PENDING_USERS', payload: pendingUsers });
            }
          } catch (error) {
            console.error('Failed to load user data:', error);
            // Clear invalid stored data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loginResult = await dataServiceAPI.login(email, password);
      if (!loginResult || !loginResult.user) {
        console.error('Login failed: Invalid response');
        return false;
      }
      
      const { user, token } = loginResult;
      
      // Set current user
      dispatch({ type: 'SET_CURRENT_USER', payload: user });
      
      // Load additional data after successful login
      const [users, chats] = await Promise.all([
        dataServiceAPI.getUsers(),
        dataServiceAPI.getChats()
      ]);
      
      dispatch({ type: 'SET_USERS', payload: users });
      dispatch({ type: 'SET_CHATS', payload: chats });
      
      // Load pending users if manager
      if (user.role === 'manager') {
        const pendingUsers = await dataServiceAPI.getPendingUsers();
        dispatch({ type: 'SET_PENDING_USERS', payload: pendingUsers });
      }
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, isManager: boolean = false): Promise<boolean> => {
    try {
      const result = await dataServiceAPI.register({ name, email, password, isManager });
      
      if (result && result.message) {
        // Reload users and pending users to get updated data
        const [users, pendingUsers] = await Promise.all([
          dataServiceAPI.getUsers(),
          dataServiceAPI.getPendingUsers()
        ]);
        
        dispatch({ type: 'SET_USERS', payload: users });
        dispatch({ type: 'SET_PENDING_USERS', payload: pendingUsers });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await dataServiceAPI.logout();
      
      dispatch({ type: 'SET_CURRENT_USER', payload: null });
      dispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
      dispatch({ type: 'SET_CURRENT_SCREEN', payload: 'chat' });
      dispatch({ type: 'SET_USERS', payload: [] });
      dispatch({ type: 'SET_CHATS', payload: [] });
      dispatch({ type: 'SET_MESSAGES', payload: {} });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const sendMessage = async (chatId: string, content: string, type: 'text' | 'file' | 'announcement' = 'text', file?: FileUpload) => {
    if (!state.currentUser) return;

    try {
      // Send message via API
      const sentMessage = await dataServiceAPI.sendMessage({
        chatId,
        content,
        type,
        isUrgent: false,
        replyTo: replyingTo?.id
      });

      // The socket event will handle the state update, but we clear the reply state now
      setReplyingTo(null);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error("Couldn't send message. Please try again.");
    }
  };

  const uploadFile = async (file: File): Promise<FileUpload> => {
    return new Promise((resolve) => {
      const fileUpload: FileUpload = {
        file,
        progress: 0,
        id: Date.now().toString()
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          fileUpload.preview = e.target?.result as string;
          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += 20;
            fileUpload.progress = progress;
            if (progress >= 100) {
              clearInterval(interval);
              resolve(fileUpload);
            }
          }, 100);
        };
        reader.readAsDataURL(file);
      } else {
        // Simulate upload for non-images
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          fileUpload.progress = progress;
          if (progress >= 100) {
            clearInterval(interval);
            resolve(fileUpload);
          }
        }, 100);
      }
    });
  };

  const editMessage = async (chatId: string, messageId: string, newContent: string) => {
    try {
      await dataServiceAPI.editMessage(chatId, messageId, newContent);
      // The socket event will handle the state update
    } catch (error) {
      console.error("Failed to edit message:", error);
      toast.error("Couldn't edit message. Please try again.");
    }
  };

  const deleteMessage = async (chatId: string, messageId: string) => {
    try {
      await dataServiceAPI.deleteMessage(chatId, messageId);
      // The socket event will handle the state update
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Couldn't delete message. Please try again.");
    }
  };

  const addReaction = async (chatId: string, messageId: string, emoji: string) => {
    if (!state.currentUser) return;
    
    try {
      const messages = state.messages[chatId] || [];
      const message = messages.find(m => m.id === messageId);
      
      if (message) {
        const existingReaction = message.reactions.find(r => r.userId === state.currentUser!.id && r.emoji === emoji);
        
        const updatedReactions = existingReaction
          ? message.reactions.filter(r => !(r.userId === state.currentUser!.id && r.emoji === emoji))
          : [...message.reactions, { emoji, userId: state.currentUser.id, userName: state.currentUser.name }];
        
        const updatedMessage = { ...message, reactions: updatedReactions };
        
        // Update locally
        dispatch({ type: 'UPDATE_MESSAGE', payload: { chatId, message: updatedMessage } });
        
        // Try to add reaction via API
        try {
          await dataServiceAPI.addReaction(messageId, emoji);
        } catch (error) {
          console.error('Failed to sync reaction:', error);
        }
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const setActiveChat = (chatId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chatId });
    if (chatId) {
      markChatAsRead(chatId, []);
      
      // Load messages for this chat if not loaded
      if (!state.messages[chatId]) {
        dataServiceAPI.getMessages(chatId).then(messages => {
          dispatch({ type: 'SET_MESSAGES', payload: { ...state.messages, [chatId]: messages } });
        }).catch(error => {
          console.error('Failed to load messages:', error);
          // Set empty array to prevent loading again
          dispatch({ type: 'SET_MESSAGES', payload: { ...state.messages, [chatId]: [] } });
        });
      }
    }
  };

  const setCurrentScreen = (screen: AppScreen) => {
    dispatch({ type: 'SET_CURRENT_SCREEN', payload: screen });
  };

  const toggleDarkMode = () => {
    const newDarkMode = !state.darkMode;
    localStorage.setItem('iib-chat-theme', newDarkMode ? 'dark' : 'light');
    dispatch({ type: 'SET_DARK_MODE', payload: newDarkMode });
  };

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!state.currentUser) return;
    
    try {
      // Update settings via API
      const updatedSettings = await dataServiceAPI.updateUserSettings(settings);
      
      dispatch({ type: 'SET_USER_SETTINGS', payload: { userId: state.currentUser.id, settings: updatedSettings } });

      // Apply theme changes immediately
      if (settings.theme) {
        const isDark = settings.theme === 'dark' || 
          (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark !== state.darkMode) {
          dispatch({ type: 'SET_DARK_MODE', payload: isDark });
        }
      }

      // Apply status changes immediately
      if (settings.status && state.currentUser) {
        const updatedUser = { ...state.currentUser, status: settings.status, lastSeen: new Date() };
        await dataServiceAPI.updateUser(updatedUser.id, { status: settings.status });
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }
    } catch (error) {
      console.error('Failed to update user settings:', error);
    }
  };

  const updateUserProfile = async (name: string, avatarFile: File | null) => {
    if (!state.currentUser) return;

    try {
      let updatedUser: User = state.currentUser;

      // Upload avatar if a new file is provided
      if (avatarFile) {
        updatedUser = await dataServiceAPI.uploadAvatar(avatarFile);
      }

      // Update name if it has changed
      if (name !== updatedUser.name) {
        updatedUser = await dataServiceAPI.updateUser(state.currentUser.id, { name });
      }

      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));

    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      dispatch({ type: 'SET_NOTIFICATION_PERMISSION', payload: permission === 'granted' });
    }
  };

  const updateUserStatus = async (status: 'online' | 'offline' | 'away' | 'busy') => {
    if (!state.currentUser) return;
    
    try {
      const updatedUser = await dataServiceAPI.updateUser(state.currentUser.id, { status, lastSeen: new Date() });
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const searchMessages = (query: string) => {
    // This function now just triggers the search
    performSearch(query);
  };

  const archiveChat = async (chatId: string) => {
    try {
      const chat = state.chats.find(c => c.id === chatId);
      if (chat) {
        const updatedChat = { ...chat, isArchived: true };
        
        // Update locally
        dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
      }
    } catch (error) {
      console.error('Failed to archive chat:', error);
    }
  };

  const markChatAsRead = async (chatId: string, messageIds: string[]) => {
    try {
      const chat = state.chats.find(c => c.id === chatId);
      if (chat && chat.unreadCount > 0) {
        const updatedChat = { ...chat, unreadCount: 0 };
        
        // Update locally
        dispatch({ type: 'UPDATE_CHAT', payload: updatedChat });
      }
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
    }
  };

  const approvePendingUser = async (userId: string) => {
    try {
      // Use the correct API function name
      await dataServiceAPI.approveUser(userId);
      
      // Refresh the data from server
      const [updatedUsers, updatedPendingUsers] = await Promise.all([
        dataServiceAPI.getUsers(),
        dataServiceAPI.getPendingUsers()
      ]);
      
      dispatch({ type: 'SET_USERS', payload: updatedUsers });
      dispatch({ type: 'SET_PENDING_USERS', payload: updatedPendingUsers });
    } catch (error) {
      console.error('Failed to approve user:', error);
    }
  };

  const rejectPendingUser = async (userId: string) => {
    try {
      // Use the correct API function name
      await dataServiceAPI.rejectUser(userId);
      
      // Refresh the pending users list from server
      const updatedPendingUsers = await dataServiceAPI.getPendingUsers();
      dispatch({ type: 'SET_PENDING_USERS', payload: updatedPendingUsers });
    } catch (error) {
      console.error('Failed to reject user:', error);
    }
  };

  const getPendingUsersCount = () => {
    return state.pendingUsers.length;
  };
  
  const updateUserRole = async (userId: string, newRole: 'manager' | 'employee') => {
    try {
      const user = state.users.find(u => u.id === userId);
      if (user && user.email !== 'iibadmin@iib.com') { // Prevent changing admin role
        const updatedUser = await dataServiceAPI.updateUser(userId, { role: newRole });
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const removeUser = async (userId: string) => {
    try {
      const user = state.users.find(u => u.id === userId);
      if (user && user.email !== 'iibadmin@iib.com') { // Prevent removing admin
        await dataServiceAPI.deleteUser(userId);
        dispatch({ type: 'SET_USERS', payload: state.users.filter(u => u.id !== userId) });
      }
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };
  
  const createDirectChat = async (otherUserId: string) => {
    if (!state.currentUser) return;
    
    try {
      // Check if direct chat already exists
      const existingChat = state.chats.find(chat => 
        chat.type === 'direct' && 
        chat.participants.includes(state.currentUser!.id) && 
        chat.participants.includes(otherUserId)
      );
      
      if (existingChat) {
        // Chat exists, just activate it
        setActiveChat(existingChat.id);
        return;
      }
      
      // Create new direct chat
      const otherUser = state.users.find(u => u.id === otherUserId);
      if (!otherUser) return;
      
      // Use the API to create direct chat
      const newChat = await dataServiceAPI.createDirectChat(otherUserId, otherUser.name);
      
      // Refresh chats
      const updatedChats = await dataServiceAPI.getChats();
      dispatch({ type: 'SET_CHATS', payload: updatedChats });
      
      // Activate the new chat
      setActiveChat(newChat.id);
      
    } catch (error) {
      console.error('Failed to create direct chat:', error);
    }
  };

  const openModal = (content: React.ReactNode) => {
    dispatch({ type: 'OPEN_MODAL', payload: content });
  };

  const closeModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  const loadOverseenChats = async () => {
    if (state.currentUser?.role !== 'manager') return;
    try {
      const chats = await dataServiceAPI.getDirectChatsForOversight();
      dispatch({ type: 'SET_OVERSEEN_CHATS', payload: chats });
    } catch (error) {
      console.error("Failed to load chats for oversight:", error);
    }
  };

  const loadMessagesForOversight = async (chatId: string) => {
    if (state.currentUser?.role !== 'manager') return;
    try {
      const messages = await dataServiceAPI.getMessagesForOversight(chatId);
      dispatch({ type: 'SET_OVERSEEN_MESSAGES', payload: { chatId, messages } });
    } catch (error) {
      console.error(`Failed to load messages for oversight chat ${chatId}:`, error);
    }
  };
  
  const setActiveOversightChat = (chat: Chat | null) => {
    dispatch({ type: 'SET_ACTIVE_OVERSIGHT_CHAT', payload: chat });
    if (chat) {
      loadMessagesForOversight(chat.id);
    }
  };

  const markMessagesAsRead = async (chatId: string, messageIds: string[]) => {
    if (messageIds.length === 0) return;
    try {
      await dataServiceAPI.markMessagesAsRead(chatId, messageIds);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const performSearch = async (query: string) => {
    if (!query) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }
    try {
      const results = await dataServiceAPI.searchMessages(query);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      setCurrentScreen('search-results');
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Search failed. Please try again.");
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherUser = state.users.find(u => chat.participants.some(p => p === u.id && u.id !== state.currentUser?.id));
      return otherUser?.name || 'Direct Chat';
    }
    return chat.name;
  };

  const contextValue: AppContextValue = {
    ...state,
    login,
    logout,
    register,
    sendMessage,
    uploadFile,
    editMessage,
    deleteMessage,
    addReaction,
    setActiveChat,
    setCurrentScreen,
    setReplyingTo: setReplyingTo,
    cancelReply,
    replyingTo,
    toggleDarkMode,
    updateUserSettings,
    updateUserProfile,
    requestNotificationPermission,
    updateUserStatus,
    searchMessages,
    archiveChat,
    markChatAsRead,
    approvePendingUser,
    rejectPendingUser,
    getPendingUsersCount,
    updateUserRole,
    removeUser,
    createDirectChat,
    isModalOpen: state.isModalOpen,
    modalContent: state.modalContent,
    openModal,
    closeModal,
    overseenChats: state.overseenChats,
    overseenMessages: state.overseenMessages,
    loadOverseenChats,
    loadMessagesForOversight,
    activeOversightChat: state.activeOversightChat,
    setActiveOversightChat,
    typingUsers: state.typingUsers,
    markMessagesAsRead,
    performSearch,
    searchResults: state.searchResults,
    getChatDisplayName,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}