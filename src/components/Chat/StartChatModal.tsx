import React, { useState } from 'react';
import { X, Search, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import UserAvatar from '../UI/UserAvatar';
import UserStatusIndicator from '../UI/UserStatusIndicator';

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StartChatModal({ isOpen, onClose }: StartChatModalProps) {
  const { currentUser, users, createDirectChat } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen || !currentUser) return null;

  // Filter out current user and search
  const availableUsers = users.filter(user => 
    user.id !== currentUser.id && 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async (otherUser: any) => {
    await createDirectChat(otherUser.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">
              Start New Chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary-50 dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="max-h-96 overflow-y-auto">
          {availableUsers.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
              <p className="text-secondary-500 dark:text-secondary-400">
                {searchQuery ? 'No users found matching your search.' : 'No other users available.'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                >
                  <div className="relative">
                    <UserAvatar user={user} size="md" showStatus={true} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-secondary-900 dark:text-white">
                        {user.name}
                      </p>
                      {user.role === 'manager' && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded">
                          Manager
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <UserStatusIndicator status={user.status} />
                      <span className="text-secondary-500 dark:text-secondary-400 capitalize">
                        {user.status}
                      </span>
                    </div>
                  </div>

                  <MessageSquare className="w-5 h-5 text-secondary-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}