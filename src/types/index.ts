export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For admin account
  role: 'manager' | 'employee';
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  isApproved?: boolean;
  registeredAt?: Date;
}

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'employee';
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'announcement';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isUrgent?: boolean;
  reactions: Reaction[];
  isDeleted?: boolean;
  editedAt?: Date;
  replyTo?: string;
  replyToContent?: string;
  replyToSender?: string;
  readBy: {
    userId: string;
    readAt: Date;
  }[];
}

export interface LinkPreviewData {
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: { url: string }[];
  ogUrl?: string;
  success: boolean;
}

export type SearchResult = Omit<Message, 'chatId'> & {
  chat: Chat;
};

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
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: number;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  granted: boolean;
  requested: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'en';
  notifications: boolean;
  status: 'online' | 'offline' | 'away' | 'busy';
}

export type AppScreen =
  | 'chat'
  | 'settings'
  | 'user-requests'
  | 'member-management'
  | 'private-chat-oversight'
  | 'profile'
  | 'admin-dashboard'
  | 'audit-log'
  | 'search-results'
  | 'start-chat'
  | 'tasks'
  | 'teams'
  | 'calendar';

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
  tasks: Task[];
  teams: Team[];
  activeTask: Task | null;
  calendarEvents: CalendarEvent[];
}

export interface FileUpload {
  file: File;
  preview?: string;
  progress: number;
  id: string;
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
  senderName: string;
  message: string;
  timestamp: string;
}

// Task Management Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  startDate: Date;
  completedDate?: Date;
  assignedTo: string;
  assignedBy: string;
  teamId?: string;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  progress: number;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  parentTaskId?: string;
  subtasks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface TaskComment {
  userId: string;
  content: string;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdBy: string;
  isActive: boolean;
  color: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'member' | 'lead' | 'admin';
  joinedAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    status: string;
    priority: string;
    description?: string;
  };
}