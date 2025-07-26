import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Edit,
  MessageSquare,
  Clock,
  User,
  Users,
  Tag,
  CheckCircle,
  Circle,
  AlertCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task } from '../../types';
import UserAvatar from '../UI/UserAvatar';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const { currentUser, users, teams, updateTask, deleteTask, addTaskComment } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    dueDate: new Date(task.dueDate).toISOString().slice(0, 16),
    assignedTo: task.assignedTo,
    teamId: task.teamId || '',
    progress: task.progress
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAssignedUser = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const getTeam = (teamId: string) => {
    return teams.find(team => team.id === teamId);
  };

  const isOverdue = (dueDate: Date) => {
    return new Date(dueDate) < new Date();
  };

  const canEdit = () => {
    return task.assignedTo === currentUser?.id || 
           task.assignedBy === currentUser?.id || 
           currentUser?.role === 'manager';
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateTask(task.id, {
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString()
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addTaskComment(task.id, newComment.trim());
      setNewComment('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
          {isEditing ? 'Edit Task' : 'Task Details'}
        </h2>
        <div className="flex items-center gap-2">
          {canEdit() && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          {canEdit() && (
            <button
              onClick={handleDeleteTask}
              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-secondary-600 dark:text-secondary-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-lg font-semibold"
              />
            ) : (
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                {task.title}
              </h3>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            ) : (
              <p className="text-secondary-600 dark:text-secondary-400">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Progress
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-secondary-500 dark:text-secondary-400">
                  <span>0%</span>
                  <span>{formData.progress}%</span>
                  <span>100%</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {task.progress}% complete
                </p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              Comments ({task.comments.length})
            </h4>
            
            <div className="space-y-3 mb-4">
              {task.comments.map((comment, index) => {
                const commentUser = users.find(user => user.id === comment.userId);
                return (
                  <div key={index} className="flex gap-3 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                    <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-secondary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {commentUser?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-secondary-600 dark:text-secondary-400">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Status
            </label>
            {isEditing ? (
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                <span className="capitalize">{task.status}</span>
              </div>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Priority
            </label>
            {isEditing ? (
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            ) : (
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Due Date
            </label>
            {isEditing ? (
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary-400" />
                <span className={isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-600 dark:text-red-400' : ''}>
                  {new Date(task.dueDate).toLocaleString()}
                </span>
                {isOverdue(task.dueDate) && task.status !== 'completed' && (
                  <span className="text-xs text-red-600 dark:text-red-400">(Overdue)</span>
                )}
              </div>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Assigned To
            </label>
            {isEditing ? (
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            ) : (
                          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary-200 dark:bg-secondary-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-secondary-400" />
              </div>
              <span>{getAssignedUser(task.assignedTo)?.name || 'Unknown User'}</span>
            </div>
            )}
          </div>

          {/* Team */}
          {task.teamId && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Team
              </label>
              {isEditing ? (
                <select
                  value={formData.teamId}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                >
                  <option value="">No team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary-400" />
                  <span>{getTeam(task.teamId)?.name || 'Unknown Team'}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Created Info */}
          <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <p className="text-xs text-secondary-500 dark:text-secondary-400">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </p>
            {task.completedDate && (
              <p className="text-xs text-secondary-500 dark:text-secondary-400">
                Completed: {new Date(task.completedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end gap-3 pt-6 border-t border-secondary-200 dark:border-secondary-700">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
} 