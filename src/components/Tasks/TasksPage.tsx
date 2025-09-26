import React, { useState, useEffect, useCallback } from 'react';
import TeamManagement from './TeamManagement';
import { 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  Clock,
  User,
  Users,
  CheckCircle,
  Circle,
  AlertCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Task, Team } from '../../types';
import UserAvatar from '../UI/UserAvatar';
import Modal from '../UI/Modal';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import CalendarView from './CalendarView';
import TaskStats from './TaskStats';
import TaskDashboard from './TaskDashboard';

export default function TasksPage() {
  const { 
    currentUser, 
    tasks, 
    teams, 
    users,
    setCurrentScreen,
    fetchTasks,
    fetchTeams,
    deleteTask
  } = useApp();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    teamId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'list' | 'calendar'>('dashboard');
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  // Debounced fetch functions to prevent rapid calls
  const debouncedFetchTasks = useCallback(() => {
    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [fetchTasks]);

  const debouncedFetchTeams = useCallback(() => {
    const timeoutId = setTimeout(() => {
      fetchTeams();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [fetchTeams]);

  useEffect(() => {
    debouncedFetchTasks();
    debouncedFetchTeams();
  }, []); // Only run once on mount

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesAssignedTo = !filters.assignedTo || task.assignedTo === filters.assignedTo;
    const matchesTeam = !filters.teamId || task.teamId === filters.teamId;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo && matchesTeam;
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

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(taskId);
    }
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      assignedTo: '',
      teamId: ''
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentScreen('chat')}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-600 dark:text-secondary-400"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-secondary-900 dark:text-white">Task Management</h1>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Manage and track your tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTeamManagement(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Manage Teams
          </button>
          <div className="flex bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'dashboard'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
              }`}
            >
              Calendar
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
              className="px-3 py-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <select
              value={filters.teamId}
              onChange={(e) => setFilters({ ...filters, teamId: e.target.value })}
              className="px-3 py-1 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg text-sm hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'dashboard' ? (
          <TaskDashboard
            tasks={tasks}
            teams={teams}
            onTaskClick={handleTaskClick}
            onCreateTask={() => setShowCreateModal(true)}
          />
        ) : viewMode === 'list' ? (
          <>
            <TaskStats tasks={tasks} />
            <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-secondary-400" />
                </div>
                <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-secondary-600 dark:text-secondary-400">
                  {searchQuery || Object.values(filters).some(f => f) 
                    ? 'Try adjusting your search or filters'
                    : 'Create your first task to get started'
                  }
                </p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const assignedUser = getAssignedUser(task.assignedTo);
                const team = task.teamId ? getTeam(task.teamId) : null;
                const overdue = isOverdue(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(task.status)}
                          <h3 className="font-medium text-secondary-900 dark:text-white truncate">
                            {task.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {overdue && task.status !== 'completed' && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs font-medium">
                              Overdue
                            </span>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-secondary-500 dark:text-secondary-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{assignedUser?.name || 'Unknown'}</span>
                          </div>

                          {task.teamId && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{team?.name || 'Unknown Team'}</span>
                            </div>
                          )}

                          {team && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{team.name}</span>
                            </div>
                          )}

                          {task.comments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{task.comments.length}</span>
                            </div>
                          )}
                        </div>

                        {task.progress > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-secondary-500 dark:text-secondary-400 mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-secondary-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          </>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onCreateTask={() => setShowCreateModal(true)}
          />
        ) : null}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <CreateTaskModal onClose={() => setShowCreateModal(false)} />
        </Modal>
      )}

      {showTaskDetail && selectedTask && (
        <Modal isOpen={showTaskDetail} onClose={() => setShowTaskDetail(false)}>
          <TaskDetailModal 
            task={selectedTask} 
            onClose={() => setShowTaskDetail(false)}
            onUpdate={() => {
              fetchTasks();
              setShowTaskDetail(false);
            }}
          />
        </Modal>
      )}

      {/* Team Management Modal */}
      {showTeamManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <TeamManagement onClose={() => setShowTeamManagement(false)} />
        </div>
      )}
    </div>
  );
} 