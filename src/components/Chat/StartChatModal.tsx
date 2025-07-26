import React, { useState } from 'react';
import { X, Search, MessageSquare, Users as UsersIcon, Plus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import UserAvatar from '../UI/UserAvatar';
import UserStatusIndicator from '../UI/UserStatusIndicator';

interface StartChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatType = 'direct' | 'group';

export default function StartChatModal({ isOpen, onClose }: StartChatModalProps) {
  const { currentUser, users, createDirectChat, createGroupChat } = useApp();
  const [chatType, setChatType] = useState<ChatType>('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  if (!isOpen || !currentUser) return null;

  // Filter out current user and search
  const availableUsers = users.filter(user => 
    user.id !== currentUser.id && 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartDirectChat = async (otherUser: any) => {
    await createDirectChat(otherUser.id);
    onClose();
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedParticipants.length === 0) {
      alert('Please enter a group name and select at least one participant.');
      return;
    }

    try {
      // Add current user to participants
      const allParticipants = [...selectedParticipants, currentUser.id];
      
      // Use the createGroupChat function from AppContext
      await createGroupChat(groupName.trim(), allParticipants);
      
      onClose();
    } catch (error) {
      console.error('Failed to create group chat:', error);
      alert('Failed to create group chat. Please try again.');
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const resetForm = () => {
    setChatType('direct');
    setSearchQuery('');
    setGroupName('');
    setSelectedParticipants([]);
  };

  const handleClose = () => {
    resetForm();
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
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Type Tabs */}
        <div className="flex border-b border-secondary-200 dark:border-secondary-700">
          <button
            onClick={() => setChatType('direct')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              chatType === 'direct'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Direct Chat
            </div>
          </button>
          <button
            onClick={() => setChatType('group')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              chatType === 'group'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Group Chat
            </div>
          </button>
        </div>

        {chatType === 'direct' ? (
          <>
            {/* Search for Direct Chat */}
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

            {/* Users List for Direct Chat */}
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
                      onClick={() => handleStartDirectChat(user)}
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
          </>
        ) : (
          <>
            {/* Group Chat Form */}
            <div className="p-4 space-y-4">
              {/* Group Name Input */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary-50 dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Search for Participants */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Add Participants
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search colleagues to add..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-secondary-50 dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Selected Participants */}
              {selectedParticipants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Selected ({selectedParticipants.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedParticipants.map(userId => {
                      const user = users.find(u => u.id === userId);
                      if (!user) return null;
                      return (
                        <div
                          key={userId}
                          className="flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                        >
                          <span>{user.name}</span>
                          <button
                            onClick={() => toggleParticipant(userId)}
                            className="hover:text-primary-900 dark:hover:text-primary-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Users for Group */}
              <div className="max-h-48 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <div className="p-4 text-center">
                    <UsersIcon className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      {searchQuery ? 'No users found matching your search.' : 'No other users available.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => toggleParticipant(user.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          selectedParticipants.includes(user.id)
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-secondary-50 dark:hover:bg-secondary-700'
                        }`}
                      >
                        <div className="relative">
                          <UserAvatar user={user} size="sm" showStatus={true} />
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-secondary-900 dark:text-white text-sm">
                              {user.name}
                            </p>
                            {user.role === 'manager' && (
                              <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded">
                                Manager
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <UserStatusIndicator status={user.status} />
                            <span className="text-secondary-500 dark:text-secondary-400 capitalize">
                              {user.status}
                            </span>
                          </div>
                        </div>

                        {selectedParticipants.includes(user.id) && (
                          <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Group Button */}
              <button
                onClick={handleCreateGroupChat}
                disabled={!groupName.trim() || selectedParticipants.length === 0}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Create Group Chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}