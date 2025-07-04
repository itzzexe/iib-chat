import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, MoreVertical, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import dataService from '../../services/dataService';
import MessageList from './MessageList';
import EmojiPicker from '../UI/EmojiPicker';

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
    typingUsers
  } = useApp();
  
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle typing indicator
  useEffect(() => {
    if (!activeChat || !currentUser) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    dataService.emitStartTyping(activeChat, currentUser.name);

    typingTimeoutRef.current = setTimeout(() => {
      dataService.emitStopTyping(activeChat);
    }, 1500); // 1.5 seconds of inactivity

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageText, activeChat, currentUser]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const currentChat = isOversight ? activeOversightChat : chats.find(c => c.id === activeChat);
  const chatMessages = isOversight 
    ? (activeOversightChat ? overseenMessages[activeOversightChat.id] : [])
    : (activeChat ? messages[activeChat] : []);

  if (!currentChat || !currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
            Welcome to IIB Chat
          </h3>
          <p className="text-secondary-500 dark:text-secondary-400 max-w-sm">
            Select a conversation from the sidebar to start chatting with your colleagues.
          </p>
        </div>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const messageType = currentChat?.type === 'announcement' && currentUser.role === 'manager' 
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
    if (file) {
      // Show immediate feedback that file is being processed
      const fileName = file.name;
      const fileSize = (file.size / (1024 * 1024)).toFixed(2);
      sendMessage(activeChat, `📎 Shared: ${fileName} (${fileSize} MB)`, 'file');
    }
  };

  const getChatTitle = () => {
    if (currentChat?.type === 'direct') {
      const otherUserId = currentChat.participants.find(id => id !== currentUser.id);
      const otherUser = users.find(u => u.id === otherUserId);
      return otherUser?.name || 'Unknown User';
    }
    return currentChat?.name || 'Chat';
  };
  
  const getChatSubtitle = () => {
    if (currentChat?.type === 'direct') {
      const otherUserId = currentChat.participants.find(id => id !== currentUser.id);
      const otherUser = users.find(u => u.id === otherUserId);
      if (otherUser) {
        return `${otherUser.status.charAt(0).toUpperCase() + otherUser.status.slice(1)} • Direct message`;
      }
      return 'Direct message';
    }
    return currentChat?.type === 'announcement' 
      ? 'Official announcements and updates'
      : currentChat?.type === 'group'
      ? `${currentChat.participants.length} members`
      : 'Direct message';
  };

  const canSendAnnouncement = currentChat?.type === 'announcement' && currentUser.role === 'manager';

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            currentChat?.type === 'announcement' 
              ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
              : currentChat?.type === 'direct'
              ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
          }`}>
            {currentChat?.type === 'announcement' && <AlertTriangle className="w-4 h-4" />}
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
        <button className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <MessageList messages={chatMessages || []} />

      {/* Typing Indicator */}
      {typingUsers && activeChat && typingUsers[activeChat]?.length > 0 && (
        <div className="px-4 py-1 text-sm text-secondary-500 italic">
          {typingUsers[activeChat].join(', ')} {typingUsers[activeChat].length > 1 ? 'are' : 'is'} typing...
        </div>
      )}

      {/* Message Input - disabled in oversight mode */}
      {!isOversight && (
        <div className="p-4 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900">
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
    </div>
  );
}