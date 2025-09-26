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
    lg: 'w-16 h-16 text-xl'
  };

  const statusPositions = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-1 -right-1',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1.5 -right-1.5'
  };

  // Get first character only from user name
  const getInitials = (name: string) => {
    if (!name) return '?';
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return '?';
    
    // Get the first character and convert to uppercase
    const firstChar = trimmedName.charAt(0);
    
    // Handle different character sets
    if (firstChar.match(/[a-zA-Z]/)) {
      return firstChar.toUpperCase();
    } else if (firstChar.match(/[\u0600-\u06FF]/)) {
      // Non-Latin characters
      return firstChar;
    } else {
      return firstChar;
    }
  };

  // Generate consistent color based on user name
  const getBackgroundColor = (name: string) => {
    if (!name) return 'bg-gray-500';
    
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-amber-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-rose-500',
      'bg-sky-500'
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
      {/* Always show initials instead of images */}
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