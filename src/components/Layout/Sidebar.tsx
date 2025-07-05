import React, { useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  Bell, 
  Settings, 
  Archive, 
  Search,
  Moon,
  Sun,
  LogOut,
  Hash,
  AtSign,
  UserPlus,
  ShieldCheck,
  BarChart,
  BookCopy
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserStatus, Chat } from '../../types';
import UserStatusIndicator from '../UI/UserStatusIndicator';
import StartChatModal from '../Chat/StartChatModal';

export default function Sidebar() {
  const { 
    currentUser, 
    chats, 
    users, 
    activeChat, 
    darkMode, 
    currentScreen,
    setActiveChat, 
    setCurrentScreen,
    toggleDarkMode, 
    logout,
    updateUserStatus,
    getPendingUsersCount,
    performSearch
  } = useApp();
  
  const [showArchived, setShowArchived] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [showStartChatModal, setShowStartChatModal] = useState(false);
  const pendingCount = getPendingUsersCount();
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  if (!currentUser) return null;

  // Ensure chats is always an array
  const safeChats = Array.isArray(chats) ? chats : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const filteredChats = safeChats.filter(chat => 
    showArchived ? chat.isArchived : !chat.isArchived
  );

  const getUnreadCount = () => {
    return safeChats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherUserId = chat.participants.find((id: string) => id !== currentUser.id);
      const otherUser = safeUsers.find(u => u.id === otherUserId);
      return otherUser?.name || 'Unknown User';
    }
    return chat.name;
  };

  const getDirectChatUser = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherUserId = chat.participants.find((id: string) => id !== currentUser.id);
      return safeUsers.find(u => u.id === otherUserId);
    }
    return null;
  };

  const getChatIcon = (chat: Chat) => {
    switch (chat.type) {
      case 'announcements':
        return <Bell className="w-4 h-4" />;
      case 'group':
        return <Hash className="w-4 h-4" />;
      case 'direct':
        return <AtSign className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(localSearchQuery);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-700">
      {/* Header */}
      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-secondary-900 dark:text-white">IIB Chat</h1>
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                {safeUsers.filter(u => u.status === 'online').length} online • {safeUsers.length} total users
              </p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
            ) : (
              <Moon className="w-4 h-4 text-secondary-600" />
            )}
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>
        </form>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentScreen('profile')}>
          <div className="relative">
            <img
              src={currentUser.avatar || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <UserStatusIndicator status={currentUser.status} className="absolute -bottom-1 -right-1" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-secondary-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              {currentUser.role === 'manager' && (
                <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                  Manager
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setStatusMenuOpen(!statusMenuOpen); }}
                className="text-sm text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 truncate text-left"
              >
                {currentUser.status.charAt(0).toUpperCase() + currentUser.status.slice(1)}
              </button>
              {statusMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg py-1 z-50">
                  {(['online', 'away', 'busy', 'offline'] as UserStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        updateUserStatus(status);
                        setStatusMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                    >
                      <UserStatusIndicator status={status} />
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-secondary-900 dark:text-white">
              Conversations
              {getUnreadCount() > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {getUnreadCount()}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showArchived 
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
                title={showArchived ? 'Show Active' : 'Show Archived'}
              >
                <Archive className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowStartChatModal(true)}
                className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
                title="Start new chat"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {/* Show all chats including default ones */}
            {filteredChats.map(chat => {
              const isGeneral = chat.type === 'general';
              const isAnnouncements = chat.type === 'announcements';
              
              return (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat.id);
                    setCurrentScreen('chat');
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-secondary-50 dark:hover:bg-secondary-800 ${
                    activeChat === chat.id 
                      ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700' 
                      : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {chat.type === 'direct' ? (
                      <div className="relative">
                        {(() => {
                          const otherUser = getDirectChatUser(chat);
                          return otherUser ? (
                            <img
                              src={otherUser.avatar || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
                              alt={otherUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-secondary-300 dark:bg-secondary-600 rounded-full flex items-center justify-center">
                              <AtSign className="w-5 h-5 text-secondary-500" />
                            </div>
                          );
                        })()}
                        {(() => {
                          const otherUser = getDirectChatUser(chat);
                          return otherUser && otherUser.status === 'online' ? (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-secondary-900 rounded-full"></div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <div className={`p-2 rounded-lg ${
                        isAnnouncements 
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                          : isGeneral
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                      }`}>
                        {getChatIcon(chat)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-secondary-900 dark:text-white truncate">
                        {getChatDisplayName(chat)}
                      </p>
                      {(chat.unreadCount || 0) > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400 truncate">
                      {isGeneral && 'Public discussion for all team members'}
                      {isAnnouncements && (currentUser.role === 'manager' ? 'Post important announcements' : 'Important announcements')}
                      {chat.type === 'direct' && 'Direct message'}
                      {chat.type === 'group' && `${chat.participants?.length || 0} members`}
                    </p>
                  </div>
                </button>
              );
            })}
            
            {filteredChats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-secondary-500 dark:text-secondary-400 text-sm">
                  {showArchived ? 'No archived chats' : 'No active conversations'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
        <div className="space-y-2">
          {/* Manager-only navigation */}
          {currentUser.role === 'manager' && (
            <>
              <button
                onClick={() => setCurrentScreen('admin-dashboard')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentScreen === 'admin-dashboard'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart className="w-4 h-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentScreen('user-requests')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentScreen === 'user-requests'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">User Requests</span>
                </div>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setCurrentScreen('member-management')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentScreen === 'member-management'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Members</span>
                </div>
                <span className="text-xs bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 px-2 py-0.5 rounded-full">
                  {safeUsers.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentScreen('private-chat-oversight')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentScreen === 'private-chat-oversight'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm font-medium">Chat Oversight</span>
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('audit-log')}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentScreen === 'audit-log'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookCopy className="w-4 h-4" />
                  <span className="text-sm font-medium">Audit Log</span>
                </div>
              </button>
            </>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('settings')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                currentScreen === 'settings'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            
            <button
              onClick={logout}
              className="flex items-center justify-center p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Start Chat Modal */}
      <StartChatModal 
        isOpen={showStartChatModal} 
        onClose={() => setShowStartChatModal(false)} 
      />
    </div>
  );
}