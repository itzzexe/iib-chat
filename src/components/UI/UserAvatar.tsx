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
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const statusPositions = {
    xs: '-bottom-0.5 -right-0.5',
    sm: '-bottom-1 -right-1',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1.5 -right-1.5'
  };

  const getAvatarUrl = () => {
    if (user.avatar?.startsWith('/uploads')) {
      return `http://localhost:3000${user.avatar}`;
    }
    if (user.avatar?.startsWith('http')) {
      return user.avatar;
    }
    // Fallback image if no avatar or if it's an emoji/invalid
    return `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`;
  };

  return (
    <div className={`relative ${className}`}>
      <img
        src={getAvatarUrl()}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white dark:border-secondary-800`}
      />
      {showStatus && (
        <UserStatusIndicator 
          status={user.status} 
          className={`absolute ${statusPositions[size]}`}
        />
      )}
    </div>
  );
}