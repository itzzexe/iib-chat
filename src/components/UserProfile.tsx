import React from 'react';
import { useApp } from '../context/AppContext';
import UserStatusIndicator from './UI/UserStatusIndicator';

export default function UserProfile() {
  const { currentUser } = useApp();
  if (!currentUser) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white dark:bg-secondary-900 rounded-xl shadow-md max-w-md mx-auto mt-10">
      <div className="relative mb-4">
        <img
          src={currentUser.avatar || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
          alt={currentUser.name}
          className="w-28 h-28 rounded-full object-cover border-4 border-primary-500 shadow-lg"
        />
        <UserStatusIndicator status={currentUser.status === 'busy' ? 'offline' : currentUser.status} className="absolute -bottom-2 -right-2 w-6 h-6 border-4 border-white dark:border-secondary-900" />
      </div>
      <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-1">{currentUser.name}</h2>
      <p className="text-secondary-600 dark:text-secondary-400 mb-2">{currentUser.email}</p>
      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-2">
        {currentUser.role === 'manager' ? 'Manager' : 'Employee'}
      </span>
      <div className="flex items-center gap-2 text-secondary-500 dark:text-secondary-400 mb-2">
        <span>Status:</span>
        <span className="capitalize font-semibold text-secondary-700 dark:text-secondary-200">{currentUser.status}</span>
      </div>
      {currentUser.registeredAt && (
        <div className="text-sm text-secondary-400 dark:text-secondary-500 mt-2">
          Joined: {new Date(currentUser.registeredAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
} 