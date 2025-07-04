import React, { useState } from 'react';
import { Users, Crown, User, Shield, MoreVertical, Search, Filter, ArrowLeft, Edit2, Check, X, Trash2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useApp } from '../../context/AppContext';
import UserAvatar from '../UI/UserAvatar';
import UserStatusIndicator from '../UI/UserStatusIndicator';

export default function MemberManagementPage() {
  const { 
    currentUser,
    users, 
    setCurrentScreen,
    updateUserRole,
    removeUser,
    register
  } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'manager' | 'employee'>('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'manager' | 'employee'>('employee');

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = (userId: string, newRole: 'manager' | 'employee') => {
    updateUserRole(userId, newRole);
    setEditingUserId(null);
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

  const getRoleIcon = (role: string) => {
    return role === 'manager' ? Crown : User;
  };

  const getRoleColor = (role: string) => {
    return role === 'manager' 
      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
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
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Member Management</h1>
            <p className="text-secondary-600 dark:text-secondary-400">
              Manage user roles and permissions
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Total Members</p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-white">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Managers</p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {users.filter(u => u.role === 'manager').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">Online Now</p>
                <p className="text-lg font-semibold text-secondary-900 dark:text-white">
                  {users.filter(u => u.status === 'online').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Manager Button */}
      <div className="px-6 py-3 border-b border-secondary-200 dark:border-secondary-700">
        <button
          onClick={() => setEditingUserId('new-manager')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
        >
          <Crown className="w-4 h-4" />
          <span>إضافة مدير جديد</span>
        </button>

        {editingUserId === 'new-manager' && (
          <div className="mt-4 p-4 bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-lg">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">إضافة مدير جديد</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const nameInput = form.elements.namedItem('name') as HTMLInputElement;
              const emailInput = form.elements.namedItem('email') as HTMLInputElement;
              const passwordInput = form.elements.namedItem('password') as HTMLInputElement;
              
              if (nameInput.value && emailInput.value && passwordInput.value) {
                register(nameInput.value, emailInput.value, passwordInput.value, true);
                setEditingUserId(null);
                form.reset();
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">الاسم</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">كلمة المرور</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={4}
                    className="w-full px-3 py-2 bg-secondary-50 dark:bg-secondary-700 border border-secondary-200 dark:border-secondary-600 rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingUserId(null)}
                    className="px-4 py-2 bg-secondary-200 hover:bg-secondary-300 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-secondary-800 dark:text-secondary-200 rounded-lg transition-colors duration-200"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
        <div className="w-full max-w-6xl">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No members found
              </h3>
              <p className="text-secondary-500 dark:text-secondary-400">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-items-center">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                const isEditing = editingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col h-full min-w-[260px] max-w-xs w-full"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {/* Avatar and Status */}
                      <div className="relative">
                        <UserAvatar user={user} size="lg" showStatus={true} />
                      </div>
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-secondary-900 dark:text-white truncate">
                            {user.name}
                          </h3>
                          {user.email === 'iibadmin@iib.com' && (
                            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs rounded-full font-medium">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-1 truncate text-sm">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <UserStatusIndicator status={user.status === 'busy' ? 'offline' : user.status} />
                          <span className={`font-medium capitalize ${getStatusColor(user.status)}`}>{user.status}</span>
                          <span className="text-secondary-400">•</span>
                          <span className="text-secondary-500 dark:text-secondary-400">Last seen:</span>
                          <span className="text-secondary-700 dark:text-secondary-300">
                            {isValid(parseISO(user.lastSeen as unknown as string)) ? format(parseISO(user.lastSeen as unknown as string), 'MMM d, HH:mm') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Role & Actions */}
                    <div className="flex items-center gap-3 mb-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as any)}
                            className="px-3 py-1 border border-secondary-300 dark:border-secondary-600 rounded-lg text-sm bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                          </select>
                          <button
                            onClick={() => handleRoleChange(user.id, selectedRole)}
                            className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 w-full">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${getRoleColor(user.role)}`}>
                            <RoleIcon className="w-4 h-4" />
                            <span className="font-medium capitalize">{user.role}</span>
                          </div>
                          {/* Edit Role Button - Only for non-admin users */}
                          {currentUser?.role === 'manager' && user.email !== 'iibadmin@iib.com' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setSelectedRole(user.role);
                                }}
                                className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400"
                                title="Change role"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to remove ${user.name}?`)) {
                                    removeUser(user.id);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
                                title="Remove user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Additional Info */}
                    {user.registeredAt && (
                      <div className="mt-auto pt-4 border-t border-secondary-100 dark:border-secondary-700 text-xs flex justify-between items-center">
                        <span className="text-secondary-500 dark:text-secondary-400">
                          Joined: {isValid(parseISO(user.registeredAt as unknown as string)) ? format(parseISO(user.registeredAt as unknown as string), 'MMMM d, yyyy') : 'N/A'}
                        </span>
                        {user.role === 'manager' && (
                          <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                            <Shield className="w-4 h-4" />
                            Can manage users
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}