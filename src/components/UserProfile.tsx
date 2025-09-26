import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import UserAvatar from './UI/UserAvatar';
import { Camera, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const { currentUser, updateUserProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!currentUser) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    try {
      await updateUserProfile(name, selectedFile);
      setIsEditing(false);
      setSelectedFile(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setName(currentUser.name);
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-white dark:bg-secondary-900 rounded-xl shadow-md max-w-md mx-auto mt-10">
      <div className="relative mb-6">
        <UserAvatar user={currentUser} size="lg" showStatus={true} />
        
        {isEditing && (
          <label className="absolute -bottom-2 -right-2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
        
        {selectedFile && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full mt-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
            New photo selected
          </div>
        )}
      </div>

      {/* Name Section */}
      <div className="w-full mb-4">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-2xl font-bold text-center bg-transparent border-b-2 border-primary-500 text-secondary-900 dark:text-white focus:outline-none"
            placeholder="Enter your name"
          />
        ) : (
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-1 text-center">{currentUser.name}</h2>
        )}
      </div>

      <p className="text-secondary-600 dark:text-secondary-400 mb-2">{currentUser.email}</p>
      
      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-4">
        {currentUser.role === 'manager' ? 'Manager' : 'Employee'}
      </span>

      <div className="flex items-center gap-2 text-secondary-500 dark:text-secondary-400 mb-4">
        <span>Status:</span>
        <span className="capitalize font-semibold text-secondary-700 dark:text-secondary-200">{currentUser.status}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={isUploading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isUploading ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {currentUser.registeredAt && (
        <div className="text-sm text-secondary-400 dark:text-secondary-500 mt-4">
          Joined: {new Date(currentUser.registeredAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
} 