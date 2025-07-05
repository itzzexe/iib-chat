import React from 'react';
import { User } from '../../types';
import UserStatusIndicator from './UserStatusIndicator';

interface UserAvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export default function UserAvatar({ 
  user, 
  size = 'md', 
  showStatus = true, 
  className = '' 
}: UserAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const statusPositions = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-1 -right-1',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1.5 -right-1.5'
  };

  // Get initials from user name
  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Generate consistent color based on user name
  const getBackgroundColor = (name: string) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-amber-500'
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const initials = getInitials(user.name);
  const backgroundColor = getBackgroundColor(user.name);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} ${backgroundColor} rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white dark:border-secondary-800 select-none`}
        title={user.name}
        style={{ 
          minWidth: sizeClasses[size].split(' ')[0].replace('w-', '').replace('h-', '') + 'px',
          minHeight: sizeClasses[size].split(' ')[1].replace('w-', '').replace('h-', '') + 'px'
        }}
      >
        {initials}
      </div>
      {showStatus && (
        <UserStatusIndicator 
          status={user.status} 
          className={`absolute ${statusPositions[size]}`}
        />
      )}
    </div>
  );
}