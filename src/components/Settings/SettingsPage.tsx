import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  Bell, 
  BellOff, 
  User, 
  Activity,
  Save,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SettingsPage() {
  const { i18n } = useTranslation();
  const { 
    currentUser, 
    userSettings, 
    darkMode,
    notifications,
    setCurrentScreen, 
    updateUserSettings, 
    updateUserStatus,
    updateUserProfile,
    requestNotificationPermission,
    closeModal
  } = useApp();

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || ''
  });
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  if (!currentUser) return null;

  const currentSettings = userSettings[currentUser.id] || {
    theme: 'auto',
    language: 'en',
    notifications: true,
    status: currentUser.status
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updateUserSettings({ theme });
  };

  const handleNotificationToggle = async () => {
    if (!notifications.granted && currentSettings.notifications) {
      await requestNotificationPermission();
    }
    updateUserSettings({ notifications: !currentSettings.notifications });
  };

  const handleStatusChange = async (status: 'online' | 'offline' | 'away' | 'busy') => {
    if (statusUpdating) return; // Prevent multiple clicks
    
    setStatusUpdating(true);
    try {
      console.log('Updating status to:', status);
      // Update user status in database
      await updateUserStatus(status);
      // Update local settings
      updateUserSettings({ status });
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      // Show error message to user
      alert('Failed to update status. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  };



  const handleProfileSave = async () => {
    setProfileSaving(true);
    await updateUserProfile(profileForm.name, null);
    setProfileSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 dark:text-green-400';
      case 'away': return 'text-yellow-600 dark:text-yellow-400';
      case 'busy': return 'text-red-600 dark:text-red-400';
      case 'offline': return 'text-secondary-400';
      default: return 'text-secondary-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
            <Settings className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white">Settings</h1>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">Manage your preferences</p>
          </div>
        </div>
        <button
          onClick={closeModal}
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="w-full max-w-lg mx-auto bg-white dark:bg-secondary-900 rounded-xl shadow-lg p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          {/* Profile Settings */}
          <div className="mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-semibold text-secondary-900 dark:text-white">Profile Settings</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  Avatar Initial
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 border-2 border-white dark:border-secondary-800">
                    {profileForm.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Your avatar will show the first letter of your name
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end pt-4">
              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors text-sm font-semibold"
              >
                <Save className="w-4 h-4" />
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
          {/* Appearance Settings */}
          <div className="mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center gap-2 mb-4">
              <Monitor className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-semibold text-secondary-900 dark:text-white">Appearance</h2>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'auto', icon: Monitor, label: 'Auto' }
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value as any)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                      currentSettings.theme === value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Status Settings */}
          <div className="mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-semibold text-secondary-900 dark:text-white">Status</h2>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Your Status
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'online', label: 'Online', color: 'bg-green-500', description: 'Available for chat' },
                  { value: 'away', label: 'Away', color: 'bg-yellow-500', description: 'Temporarily unavailable' },
                  { value: 'busy', label: 'Busy', color: 'bg-red-500', description: 'Do not disturb' },
                  { value: 'offline', label: 'Offline', color: 'bg-secondary-400', description: 'Not available' }
                ].map(({ value, label, color, description }) => (
                  <button
                    key={value}
                    onClick={() => handleStatusChange(value as any)}
                    disabled={statusUpdating}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                      currentSettings.status === value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300 dark:hover:border-secondary-600'
                    } ${statusUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={description}
                  >
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="font-medium text-secondary-900 dark:text-white text-sm">{label}</span>
                    <span className="text-xs text-secondary-500 dark:text-secondary-400 text-center">{description}</span>
                    {statusUpdating && currentSettings.status === value && (
                      <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
                Click on a status to update your availability. Changes will be visible to other users.
              </p>
            </div>
          </div>
          {/* Notification Settings */}
          <div className="mb-6 pb-6 border-b border-secondary-200 dark:border-secondary-700">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-base font-semibold text-secondary-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-secondary-900 rounded-lg">
                <div className="flex items-center gap-3">
                  {currentSettings.notifications ? (
                    <Bell className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <BellOff className="w-5 h-5 text-secondary-400" />
                  )}
                  <div>
                    <p className="font-medium text-secondary-900 dark:text-white">Desktop Notifications</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">{currentUser.email}</p>
                      {currentUser.role === 'manager' && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                          Manager
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400">
                      Get notified when you receive new messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentSettings.notifications
                      ? 'bg-primary-600'
                      : 'bg-secondary-300 dark:bg-secondary-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentSettings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {!notifications.granted && currentSettings.notifications && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Browser notification permission is required. Please allow notifications when prompted.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="mb-6">
            <h2 className="text-base font-semibold text-secondary-900 dark:text-white mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-secondary-600 dark:text-secondary-400">Role</span>
                <span className="font-medium text-secondary-900 dark:text-white capitalize">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-600 dark:text-secondary-400">Email</span>
                <span className="font-medium text-secondary-900 dark:text-white">
                  {currentUser.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-secondary-600 dark:text-secondary-400">Status</span>
                <span className={`font-medium capitalize ${getStatusColor(currentUser.status)}`}>
                  {currentUser.status}
                </span>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}