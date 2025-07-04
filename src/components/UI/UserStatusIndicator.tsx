import React from 'react';

interface UserStatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

export default function UserStatusIndicator({ status, className = '' }: UserStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
        return 'bg-secondary-400';
      default:
        return 'bg-secondary-400';
    }
  };

  return (
    <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-secondary-800 ${getStatusColor()} ${className}`} />
  );
}