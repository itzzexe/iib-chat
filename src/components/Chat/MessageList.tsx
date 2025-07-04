import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday, parseISO, isValid } from 'date-fns';
import { AlertTriangle, FileText, Download, Edit, Trash2, Smile, MoreHorizontal, Save, X, CornerUpLeft, Check, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Message, LinkPreviewData } from '../../types';
import UserAvatar from '../UI/UserAvatar';
import EmojiPicker from '../UI/EmojiPicker';
import { getLinkMetadata } from '../../services/dataService';
import LinkPreviewCard from './LinkPreviewCard';

interface MessageListProps {
  messages: Message[];
}

const MessageContentWithLinkPreview = ({ content }: { content: string }) => {
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    
    if (urls && urls[0]) {
      setIsLoading(true);
      getLinkMetadata(urls[0])
        .then(data => setPreviewData(data))
        .catch(err => console.error("Link preview error:", err))
        .finally(() => setIsLoading(false));
    }
  }, [content]);

  return (
    <div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      {previewData && <LinkPreviewCard data={previewData} />}
    </div>
  );
};

export default function MessageList({ messages }: MessageListProps) {
  const { currentUser, users, addReaction, editMessage, deleteMessage, setReplyingTo, markMessagesAsRead } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) return '';
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getSender = (senderId: string) => {
    return users.find(u => u.id === senderId);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [date: string]: Message[] } = {};
    messages.forEach(message => {
      const date = typeof message.timestamp === 'string' ? parseISO(message.timestamp) : message.timestamp;
      const dateKey = isValid(date) ? format(date, 'yyyy-MM-dd') : 'Invalid date';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });
    return grouped;
  };

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const groupedMessages = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-secondary-400 dark:text-secondary-500" />
          </div>
          <p className="text-secondary-500 dark:text-secondary-400">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dayMessages]) => (
        <div key={date}>
          {/* Date Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-secondary-100 dark:bg-secondary-800 px-4 py-1 rounded-full">
              <span className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                {formatDateHeader(date)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          {dayMessages.map((message, index) => {
            if (message.isDeleted) {
              return (
                <div key={message.id} className="text-center text-sm text-secondary-500 italic py-2">
                  This message was deleted.
                </div>
              );
            }

            const sender = getSender(message.senderId);
            const isOwnMessage = message.senderId === currentUser?.id;
            const showAvatar = !isOwnMessage && (
              index === 0 || 
              dayMessages[index - 1].senderId !== message.senderId
            );

            const getReadStatusIcon = () => {
              if (!isOwnMessage) return null;
              
              const otherParticipants = currentChat.participants.filter(p => p !== currentUser?.id);
              const readByAllOthers = otherParticipants.every(pId => 
                message.readBy.some(r => r.userId === pId)
              );

              if (readByAllOthers) {
                return <CheckCheck className="w-4 h-4 text-blue-500" />;
              }
              if (message.readBy.length > 1) { // Read by at least one other person
                return <CheckCheck className="w-4 h-4" />;
              }
              return <Check className="w-4 h-4" />; // Delivered
            };

            return (
              <div
                key={message.id}
                data-message-id={message.id}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                className={`flex gap-3 group relative ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8">
                  {showAvatar && !isOwnMessage && sender && (
                    <UserAvatar 
                      user={sender} 
                      size="sm"
                      showStatus={false}
                    />
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 max-w-2xl ${isOwnMessage ? 'text-right' : ''}`}>
                  {/* Sender name and time */}
                  {showAvatar && !isOwnMessage && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-secondary-900 dark:text-white">
                        {sender?.name}
                      </span>
                      {sender?.role === 'manager' && (
                        <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded">
                          Manager
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`inline-block max-w-full rounded-lg px-4 py-3 ${
                      message.type === 'announcement'
                        ? 'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-600'
                        : isOwnMessage
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-900 dark:text-white'
                    } ${message.isUrgent ? 'ring-2 ring-red-400 dark:ring-red-600' : ''}`}
                  >
                    {/* Urgent indicator */}
                    {message.isUrgent && (
                      <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Urgent</span>
                      </div>
                    )}

                    {/* File message */}
                    {message.type === 'file' && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 mb-2">
                        <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-blue-900 dark:text-blue-100 truncate">
                            File Shared
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            Click to download (when implemented)
                          </p>
                        </div>
                        <button 
                          className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400"
                          title="Download feature coming soon"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Message text */}
                    {editingMessage && editingMessage.id === message.id ? (
                      <div className="w-full">
                        <textarea
                          value={editingMessage.content}
                          onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                          className="w-full p-2 rounded-lg border bg-white dark:bg-secondary-700 text-sm"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingMessage(null)} className="text-xs hover:underline">Cancel</button>
                          <button 
                            onClick={() => {
                              editMessage(message.chatId!, message.id, editingMessage.content);
                              setEditingMessage(null);
                            }} 
                            className="text-xs font-bold text-primary-600 hover:underline"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-secondary-200 dark:bg-secondary-700 rounded-lg text-xs opacity-80">
                            <p className="font-bold">{message.replyToSender}</p>
                            <p className="truncate">{message.replyToContent}</p>
                          </div>
                        )}
                        <MessageContentWithLinkPreview content={message.content} />
                      </>
                    )}

                    {/* Edited indicator */}
                    {message.editedAt && (
                      <p className="text-xs opacity-70 mt-1 italic">
                        (edited)
                      </p>
                    )}
                  </div>

                  {/* Reactions */}
                  {message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {/* Group reactions by emoji */}
                      {Object.entries(
                        message.reactions.reduce((acc, reaction) => {
                          if (!acc[reaction.emoji]) {
                            acc[reaction.emoji] = [];
                          }
                          acc[reaction.emoji].push(reaction);
                          return acc;
                        }, {} as { [emoji: string]: typeof message.reactions })
                      ).map(([emoji, reactions]) => (
                        <div
                          key={emoji}
                          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs cursor-pointer transition-colors ${
                            reactions.some(r => r.userId === currentUser?.id)
                              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                          }`}
                          title={reactions.map(r => r.userName).join(', ')}
                          onClick={() => addReaction(message.senderId, message.id, emoji)}
                        >
                          <span>{emoji}</span>
                          {reactions.length > 1 && (
                            <span className="font-medium">{reactions.length}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message time and actions */}
                  <div className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isOwnMessage ? 'justify-start' : 'justify-end'
                  }`}>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400">
                      {formatMessageTime(message.timestamp)}
                    </span>
                    
                    {/* Actions Menu */}
                    {isOwnMessage && hoveredMessageId === message.id && !editingMessage && (
                      <div className="flex items-center gap-1 bg-white dark:bg-secondary-700 p-1 rounded-md shadow-lg">
                        <button 
                          onClick={() => setEditingMessage({ id: message.id, content: message.content })}
                          className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 text-secondary-500 dark:text-secondary-400"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => setReplyingTo(message)}
                          className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 text-secondary-500 dark:text-secondary-400"
                        >
                          <CornerUpLeft className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => deleteMessage(message.chatId!, message.id)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    {/* Reaction button */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="p-1 rounded hover:bg-secondary-200 dark:hover:bg-secondary-700 text-secondary-500 dark:text-secondary-400"
                      >
                        <Smile className="w-3 h-3" />
                      </button>
                      
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full mb-2 z-50">
                          <EmojiPicker 
                            onEmojiSelect={(emoji) => {
                              addReaction(message.senderId, message.id, emoji);
                              setShowEmojiPicker(null);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Read receipt */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                      {getReadStatusIcon()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
}