import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import UserAvatar from '../UI/UserAvatar';
import { format } from 'date-fns';

export default function SearchResultsPage() {
  const { searchResults, setCurrentScreen, getChatDisplayName } = useApp();

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900">
      <div className="flex items-center gap-4 p-6 border-b border-secondary-200 dark:border-secondary-700">
        <button
          onClick={() => setCurrentScreen('chat')}
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Search Results</h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Found {searchResults.length} matching messages.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p>No results found.</p>
          </div>
        ) : (
          searchResults.map(result => (
            <div key={result.id} className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
              <div className="flex items-start gap-3">
                <UserAvatar user={{ id: result.senderId, name: result.senderName, avatar: result.senderId.avatar } as any} size="sm" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-bold">{result.senderName}</p>
                    <p className="text-xs text-secondary-500">{format(new Date(result.timestamp), 'MMM d, yyyy')}</p>
                  </div>
                  <p className="text-sm mt-1">{result.content}</p>
                  <p className="text-xs mt-2 text-primary-600 font-medium">
                    in chat: {getChatDisplayName(result.chat)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 