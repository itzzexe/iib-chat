import React, { useState } from 'react';
import { Users, Check, X, Clock, ArrowLeft, UserPlus } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useApp } from '../../context/AppContext';

export default function UserRequestsPage() {
  const { 
    pendingUsers, 
    setCurrentScreen, 
    approvePendingUser, 
    rejectPendingUser 
  } = useApp();

  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  const handleApprove = async (userId: string) => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userId));
      await approvePendingUser(userId);
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userId));
      await rejectPendingUser(userId);
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b border-secondary-200 dark:border-secondary-700">
        <button
          onClick={() => setCurrentScreen('chat')}
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">User Requests</h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              {pendingUsers.length} pending approval{pendingUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {pendingUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No Pending Requests
              </h3>
              <p className="text-secondary-500 dark:text-secondary-400 max-w-sm">
                All user registration requests have been processed. New requests will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                            {user.name}
                          </h3>
                          <p className="text-secondary-600 dark:text-secondary-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Role
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                              Employee
                            </span>
                            <span className="text-xs text-secondary-500 dark:text-secondary-400">
                              (Will be assigned after approval)
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Requested
                          </p>
                          <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                              {(() => {
                                let dateValue = user.requestedAt;
                                if (typeof dateValue === 'string') {
                                  dateValue = parseISO(dateValue);
                                }
                                if (!isValid(dateValue)) return 'Invalid date';
                                return format(dateValue, 'MMM d, yyyy HH:mm');
                              })()}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                            Status
                          </p>
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded text-sm font-medium">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={processingUsers.has(user.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      <Check className="w-4 h-4" />
                      {processingUsers.has(user.id) ? 'Processing...' : 'Approve'}
                    </button>
                    
                    <button
                      onClick={() => handleReject(user.id)}
                      disabled={processingUsers.has(user.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                    >
                      <X className="w-4 h-4" />
                      {processingUsers.has(user.id) ? 'Processing...' : 'Reject'}
                    </button>
                    
                    <div className="text-sm text-secondary-500 dark:text-secondary-400 ml-auto">
                      Account will be created upon approval
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}