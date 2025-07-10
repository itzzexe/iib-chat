import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, AlertTriangle, X, Users, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import dataService from '../../services/dataService';
import MessageList from './MessageList';
import EmojiPicker from '../UI/EmojiPicker';
import Modal from '../UI/Modal';

interface ChatAreaProps {
  isOversight?: boolean;
}

export default function ChatArea({ isOversight = false }: ChatAreaProps) {
  const { 
    currentUser, 
    activeChat, 
    chats, 
    users, 
    messages, 
    sendMessage,
    // For oversight
    activeOversightChat,
    overseenMessages,
    // For replying
    replyingTo,
    cancelReply,
    // For typing
    typingUsers,
    deleteChat,
    clearChatMessages
  } = useApp();
  
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Handle typing indicator
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    dataService.emitTyping(activeChat, currentUser.id, currentUser.name, true);

    typingTimeoutRef.current = window.setTimeout(() => {
      dataService.emitTyping(activeChat, currentUser.id, currentUser.name, false);
    }, 1500); // 1.5 seconds of inactivity

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, activeChat, currentUser]);

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;

      // Ensure smooth transition
      textarea.style.transition = 'height 0.2s ease';
    }
  }, [messageText]);

  // Ensure chats and users are always arrays
  const safeChats = Array.isArray(chats) ? chats : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const currentChat = isOversight ? activeOversightChat : safeChats.find(c => c.id === activeChat);
  const chatMessages = isOversight 
    ? (activeOversightChat ? overseenMessages[activeOversightChat.id] : [])
    : (activeChat ? messages[activeChat] : []);

  const currentMessages = safeChats.length > 0 && activeChat ? 
    (messages[activeChat] || []) : [];

  if (!currentChat || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-secondary-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
            Select a chat to start messaging
          </h3>
          <p className="text-secondary-500 dark:text-secondary-400">
            Choose a conversation from the sidebar to begin
          </p>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !activeChat) return;

    const messageType = currentChat?.type === 'announcements' && currentUser.role === 'manager' 
      ? 'announcement' 
      : 'text';

    sendMessage(activeChat, messageText.trim(), messageType);
    setMessageText('');
    setIsUrgent(false);
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChat) {
      // Show immediate feedback that file is being processed
      const fileName = file.name;
      const fileSize = (file.size / (1024 * 1024)).toFixed(2);
      sendMessage(activeChat, `📎 Shared: ${fileName} (${fileSize} MB)`, 'file');
    }
  };

  const getChatTitle = () => {
    if (currentChat?.type === 'direct') {
      const otherUserId = currentChat.participants.find(id => id !== currentUser.id);
      const otherUser = safeUsers.find(u => u.id === otherUserId);
      return otherUser?.name || 'Unknown User';
    }
    return currentChat?.name || 'Chat';
  };
  
  const getChatSubtitle = () => {
    if (currentChat?.type === 'direct') {
      const otherUserId = currentChat.participants.find(id => id !== currentUser.id);
      const otherUser = safeUsers.find(u => u.id === otherUserId);
      if (otherUser) {
        return `${otherUser.status.charAt(0).toUpperCase() + otherUser.status.slice(1)} • Direct message`;
      }
      return 'Direct message';
    }
    return currentChat?.type === 'announcements' 
      ? 'Official announcements and updates'
      : currentChat?.type === 'group'
      ? `${currentChat.participants?.length || 0} members`
      : 'Direct message';
  };

  const canSendAnnouncement = currentChat?.type === 'announcements' && currentUser.role === 'manager';

  const canDeleteChat = () => {
    return currentUser.role === 'manager' && 
           currentChat.type !== 'general' && 
           currentChat.type !== 'announcements';
  };

  const canClearChat = () => {
    return currentUser.role === 'manager';
  };

  const handleDeleteChat = async () => {
    try {
      await deleteChat(currentChat.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleClearChat = async () => {
    try {
      await clearChatMessages(currentChat.id);
      setShowClearModal(false);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full max-h-full bg-white dark:bg-secondary-900">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            currentChat?.type === 'announcements' 
              ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
              : currentChat?.type === 'direct'
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
          }`}>
            {currentChat?.type === 'announcements' && <AlertTriangle className="w-4 h-4" />}
            {currentChat?.type === 'direct' && <Send className="w-4 h-4" />}
            {currentChat?.type === 'group' && <Send className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="font-semibold text-secondary-900 dark:text-white">
              {getChatTitle()}
            </h2>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {getChatSubtitle()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canClearChat() && (
            <button
              onClick={() => setShowClearModal(true)}
              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
              title="Clear all messages"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {canDeleteChat() && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete chat"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container - Fixed Height */}
      <div className="flex-1 min-h-0 relative">
        <MessageList messages={chatMessages || []} />
      </div>

      {/* Typing Indicator - Absolute Position */}
      {typingUsers && activeChat && typingUsers[activeChat]?.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 px-4 py-1 bg-white dark:bg-secondary-900 text-sm text-secondary-500 italic">
          {typingUsers[activeChat].join(', ')} {typingUsers[activeChat].length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      {/* Message Input - Fixed at Bottom */}
      {!isOversight && (
        <div className="flex-shrink-0 p-4 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
          {/* Replying To Indicator */}
          {replyingTo && (
            <div className="mb-2 p-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg text-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-primary-600">Replying to {replyingTo.senderName}</p>
                <p className="text-secondary-600 dark:text-secondary-400 truncate">{replyingTo.content}</p>
              </div>
              <button onClick={cancelReply} className="p-1 rounded-full hover:bg-secondary-200 dark:hover:bg-secondary-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {canSendAnnouncement && (
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setIsUrgent(!isUrgent)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isUrgent
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                Mark as Urgent
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  canSendAnnouncement 
                    ? "Type an announcement for the team..."
                    : "Type a message..."
                }
                rows={1}
                className="w-full resize-none rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 px-4 py-3 pr-24 text-secondary-900 dark:text-white placeholder-secondary-500 dark:placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                style={{
                  maxHeight: '120px',
                  minHeight: '44px',
                  transition: 'height 0.2s ease'
                }}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center gap-1">
                <button
                  onClick={handleFileSelect}
                  className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 dark:text-secondary-400 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-500 dark:text-secondary-400 transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50">
                  <EmojiPicker 
                    onEmojiSelect={(emoji) => {
                      setMessageText(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className={`p-3 rounded-lg transition-all ${
                messageText.trim()
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-400 dark:text-secondary-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
            className="hidden"
          />
        </div>
      )}

      {/* Delete Chat Modal */}
      {showDeleteModal && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              Delete Chat
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              Are you sure you want to delete "{getChatTitle()}"? This action cannot be undone and will delete all messages.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Chat Modal */}
      {showClearModal && (
        <Modal isOpen={showClearModal} onClose={() => setShowClearModal(false)}>
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              Clear Messages
            </h3>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">
              Are you sure you want to clear all messages in "{getChatTitle()}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}