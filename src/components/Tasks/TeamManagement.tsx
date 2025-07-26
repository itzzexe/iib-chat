import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  Crown, 
  Shield,
  User,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { Team, User as UserType } from '../../types';
import { useApp } from '../../context/AppContext';

interface TeamManagementProps {
  onClose: () => void;
}

interface CreateTeamData {
  name: string;
  description: string;
  color: string;
  members: string[];
}

const TEAM_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
];

export default function TeamManagement({ onClose }: TeamManagementProps) {
  const { 
    teams, 
    users, 
    createTeam, 
    updateTeam, 
    deleteTeam, 
    addTeamMember, 
    removeTeamMember,
    updateUserRole 
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [createTeamData, setCreateTeamData] = useState<CreateTeamData>({
    name: '',
    description: '',
    color: TEAM_COLORS[0],
    members: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'manager' | 'employee'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleCreateTeam = async () => {
    try {
      await createTeam(createTeamData);
      setCreateTeamData({
        name: '',
        description: '',
        color: TEAM_COLORS[0],
        members: []
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;
    
    try {
      await updateTeam(selectedTeam.id, {
        name: createTeamData.name,
        description: createTeamData.description,
        color: createTeamData.color
      });
      setShowEditModal(false);
      setSelectedTeam(null);
    } catch (error) {
      console.error('Failed to update team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(teamId);
      } catch (error) {
        console.error('Failed to delete team:', error);
      }
    }
  };

  const handleAddMember = async (teamId: string, userId: string, role: 'member' | 'lead') => {
    try {
      await addTeamMember(teamId, userId, role);
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      await removeTeamMember(teamId, userId);
    } catch (error) {
      console.error('Failed to remove team member:', error);
    }
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setCreateTeamData({
      name: team.name,
      description: team.description || '',
      color: team.color,
      members: team.members.map(m => m.userId)
    });
    setShowEditModal(true);
  };

  const getTeamMemberRole = (team: Team, userId: string) => {
    const member = team.members.find(m => m.userId === userId);
    return member?.role || 'member';
  };

  const isUserInTeam = (team: Team, userId: string) => {
    return team.members.some(m => m.userId === userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTeamRoleIcon = (role: string) => {
    switch (role) {
      case 'lead':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and manage teams for task assignment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Teams List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {teams.map(team => (
            <div
              key={team.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditTeam(team)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {team.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {team.description}
                </p>
              )}

              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Members ({team.members.length})
                </h4>
                <div className="space-y-1">
                  {team.members.map(member => {
                    const user = users.find(u => u.id === member.userId);
                    return user ? (
                      <div key={member.userId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getTeamRoleIcon(member.role)}
                          <span className="text-gray-700 dark:text-gray-300">
                            {user.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(team.id, member.userId)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Add Member Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Member
                </h4>
                <div className="space-y-2">
                  {filteredUsers
                    .filter(user => !isUserInTeam(team, user.id))
                    .slice(0, 3)
                    .map(user => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className="text-gray-700 dark:text-gray-300">
                            {user.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAddMember(team.id, user.id, 'member')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => handleAddMember(team.id, user.id, 'lead')}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                          >
                            Lead
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Users List */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Users
            </h3>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="manager">Managers</option>
                <option value="employee">Employees</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getRoleIcon(user.role)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {teams.filter(team => isUserInTeam(team, user.id)).map(team => (
                    <div
                      key={team.id}
                      className="px-2 py-1 text-xs rounded-full text-white"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Team
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={createTeamData.name}
                  onChange={(e) => setCreateTeamData({...createTeamData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={createTeamData.description}
                  onChange={(e) => setCreateTeamData({...createTeamData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {TEAM_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setCreateTeamData({...createTeamData, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        createTeamData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!createTeamData.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Team
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={createTeamData.name}
                  onChange={(e) => setCreateTeamData({...createTeamData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={createTeamData.description}
                  onChange={(e) => setCreateTeamData({...createTeamData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter team description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {TEAM_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setCreateTeamData({...createTeamData, color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        createTeamData.color === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeam}
                disabled={!createTeamData.name.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 