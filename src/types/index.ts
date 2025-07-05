export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export type AppScreen = 
  | 'chat' 
  | 'settings' 
  | 'user-requests' 
  | 'member-management' 
  | 'private-chat-oversight' 
  | 'profile' 
  | 'search-results' 
  | 'admin-dashboard' 
  | 'audit-log' 
  | 'start-chat';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For admin account
  role: 'manager' | 'employee';
  avatar?: string;
  status: UserStatus;
  lastSeen: Date;
  isApproved?: boolean;
  registeredAt?: Date;
}

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'employee';
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  isManager?: boolean;
}

export interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file' | 'announcement';
  timestamp: Date;
  reactions: MessageReaction[];
  readBy: MessageReadStatus[];
  replyTo?: string;
  isDeleted?: boolean;
  editedAt?: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  isUrgent?: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface MessageReadStatus {
  userId: string;
  readAt: Date;
}

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  success: boolean;
}

export interface SearchResult {
  id: string;
  type: 'message' | 'user' | 'chat';
  title: string;
  content: string;
  chatId?: string;
  userId?: string;
  timestamp?: Date;
  relevance: number;
}

export interface Reaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'general' | 'announcements';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  granted: boolean;
  requested: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'ar';
  notifications: boolean;
  soundEnabled: boolean;
  emailNotifications: boolean;
  status: UserStatus;
}

export interface AppState {
  loading: boolean;
  currentUser: User | null;
  users: User[];
  pendingUsers: PendingUser[];
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  currentScreen: AppScreen;
  darkMode: boolean;
  notifications: NotificationSettings;
  searchResults: SearchResult[];
  typingUsers: { [chatId: string]: string[] };
  overseenChats: Chat[];
  overseenMessages: { [chatId: string]: Message[] };
  activeOversightChat: Chat | null;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  userSettings: { [userId: string]: UserSettings };
}

export interface FileUpload {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface AuditLog {
  _id: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  targetId: string;
  details: any;
  createdAt: string;
}

export interface BroadcastMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isUrgent: boolean;
}

export interface NotificationState {
  enabled: boolean;
  granted: boolean;
  requested: boolean;
}