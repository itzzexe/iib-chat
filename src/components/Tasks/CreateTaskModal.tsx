import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Calendar,
  User,
  Users,
  Tag,
  Repeat,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CreateTaskModalProps {
  onClose: () => void;
}

export default function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const { users, teams, createTask, currentUser } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    dueDate: '',
    assignedTo: '',
    teamId: '',
    assignmentType: 'individual' as 'individual' | 'team',
    tags: [] as string[],
    isRecurring: false,
    recurringPattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  });
  
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    // Ensure we have either an assigned user or team
    if (formData.assignmentType === 'individual') {
      if (!formData.assignedTo) {
        newErrors.assignedTo = 'Please assign the task to someone';
      }
    } else if (formData.assignmentType === 'team') {
      if (!formData.teamId) {
        newErrors.teamId = 'Please select a team';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating task with data:', formData);
      
      // Create task data with required fields
      const taskData: any = {
        title: formData.title,
        description: formData.description || '',
        priority: formData.priority,
        dueDate: new Date(formData.dueDate).toISOString(),
        tags: formData.tags || [],
        isRecurring: formData.isRecurring || false
      };
      
      // Handle assignment
      if (formData.assignmentType === 'individual') {
        taskData.assignedTo = formData.assignedTo;
      } else if (formData.assignmentType === 'team') {
        taskData.assignedTo = formData.assignedTo || (currentUser as any)?._id || currentUser?.id;
        taskData.teamId = formData.teamId;
      }
      
      // Add recurring pattern if needed
      if (formData.isRecurring && formData.recurringPattern) {
        taskData.recurringPattern = formData.recurringPattern;
      }
      
      console.log('Final task data:', taskData);
      console.log('Current user:', currentUser);
      console.log('Current user ID:', currentUser?.id);
      console.log('Assignment type:', formData.assignmentType);
      console.log('Assigned to:', formData.assignedTo);
      console.log('Team ID:', formData.teamId);
      console.log('Users available:', users.map(u => ({ id: u.id, name: u.name })));
      
      await createTask(taskData);
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      setErrors({ submit: 'Failed to create task. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-secondary-900 rounded-lg shadow-xl">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-secondary-200 dark:border-secondary-700 flex-shrink-0">
        <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
          Create New Task
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-2 pb-4">
        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Task Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 bg-white dark:bg-secondary-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${
              errors.title ? 'border-red-500' : 'border-secondary-300 dark:border-secondary-600'
            }`}
            placeholder="Enter task title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            placeholder="Enter task description"
          />
        </div>

        {/* Priority and Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Due Date *
            </label>
            <input
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={`w-full px-3 py-2 bg-white dark:bg-secondary-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${
                errors.dueDate ? 'border-red-500' : 'border-secondary-300 dark:border-secondary-600'
              }`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>
            )}
          </div>
        </div>

        {/* Assignment Type */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Assignment Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="assignmentType"
                value="individual"
                checked={formData.assignmentType === 'individual'}
                onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <User className="w-4 h-4" />
              <span className="text-secondary-700 dark:text-secondary-300">Individual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="assignmentType"
                value="team"
                checked={formData.assignmentType === 'team'}
                onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <Users className="w-4 h-4" />
              <span className="text-secondary-700 dark:text-secondary-300">Team</span>
            </label>
          </div>
        </div>

        {/* Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formData.assignmentType === 'individual' ? (
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Assign To Individual *
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                className={`w-full px-3 py-2 bg-white dark:bg-secondary-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${
                  errors.assignedTo ? 'border-red-500' : 'border-secondary-300 dark:border-secondary-600'
                }`}
              >
                <option value="">Select user</option>
                {users.map(user => (
                  <option key={user.id} value={(user as any)._id || user.id}>{user.name}</option>
                ))}
              </select>
              {errors.assignedTo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assignedTo}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Assign To Team *
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => handleInputChange('teamId', e.target.value)}
                className={`w-full px-3 py-2 bg-white dark:bg-secondary-900 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white ${
                  errors.teamId ? 'border-red-500' : 'border-secondary-300 dark:border-secondary-600'
                }`}
              >
                <option value="">Select team</option>
                {teams.map(team => (
                  <option key={team.id} value={(team as any)._id || team.id}>{team.name}</option>
                ))}
              </select>
              {errors.teamId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.teamId}</p>
              )}
            </div>
          )}

          {formData.assignmentType === 'individual' && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Additional Team (Optional)
              </label>
              <select
                value={formData.teamId || ''}
                onChange={(e) => handleInputChange('teamId', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option value="">No additional team</option>
                {teams.map(team => (
                  <option key={team.id} value={(team as any)._id || team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-primary-900 dark:hover:text-primary-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recurring Task */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
              className="rounded border-secondary-300 dark:border-secondary-600 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
              Recurring Task
            </span>
          </label>
          
          {formData.isRecurring && (
            <div className="mt-3">
              <select
                value={formData.recurringPattern}
                onChange={(e) => handleInputChange('recurringPattern', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-secondary-900 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
} 