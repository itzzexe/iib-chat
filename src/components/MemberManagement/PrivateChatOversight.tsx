import React, { useEffect } from 'react';
import { ShieldCheck, MessageSquare, ArrowLeft, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Chat, User } from '../../types';
import ChatArea from '../Chat/ChatArea';
import UserAvatar from '../UI/UserAvatar';

export default function PrivateChatOversight() {
  const {
    overseenChats,
    loadOverseenChats,
    activeOversightChat,
    setActiveOversightChat,
    setCurrentScreen,
    users,
  } = useApp();

  useEffect(() => {
    loadOverseenChats();
  }, []);

  const getChatParticipants = (chat: Chat): User[] => {
    return chat.participants
      .map((p: any) => users.find(u => u.id === p._id || u.id === p))
      .filter((u): u is User => Boolean(u));
  };

  return (
    <div className="flex h-full bg-white dark:bg-secondary-900">
      {/* Sidebar with all direct chats */}
      <div className="w-1/3 min-w-[350px] max-w-[450px] border-r border-secondary-200 dark:border-secondary-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-secondary-200 dark:border-secondary-700 flex items-center gap-4">
           <button
            onClick={() => setCurrentScreen('chat')}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary-900 dark:text-white">Chat Oversight</h1>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm">{overseenChats.length} direct chats found</p>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2">
          {overseenChats.map(chat => {
            const participants = getChatParticipants(chat);
            return (
              <button
                key={chat.id}
                onClick={() => setActiveOversightChat(chat)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  activeOversightChat?.id === chat.id
                    ? 'bg-primary-50 dark:bg-primary-900/40'
                    : 'hover:bg-secondary-50 dark:hover:bg-secondary-800'
                }`}
              >
                <div className="flex -space-x-4">
                  {participants.slice(0, 2).map(p => (
                    <UserAvatar key={p.id} user={p} size="md" showStatus={false} className="border-2 border-white dark:border-secondary-800 rounded-full" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary-800 dark:text-secondary-100 truncate">
                    {participants.map(p => p.name).join(' & ')}
                  </p>
                  <p className="text-sm text-secondary-500 dark:text-secondary-400">
                    {participants.length} participants
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {activeOversightChat ? (
          <ChatArea isOversight={true} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
            </div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Select a chat to view</h2>
            <p className="text-secondary-500 dark:text-secondary-400 mt-2 max-w-sm">
              As a manager, you can view the content of any direct message conversation between employees for oversight purposes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}