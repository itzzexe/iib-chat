import React from 'react';
import { Calendar, Clock, TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { Task, Team } from '../../types';
import TaskStats from './TaskStats';
import UpcomingTasks from './UpcomingTasks';

interface TaskDashboardProps {
  tasks: Task[];
  teams: Team[];
  onTaskClick: (task: Task) => void;
  onCreateTask: () => void;
}

const TaskDashboard: React.FC<TaskDashboardProps> = ({ 
  tasks, 
  teams, 
  onTaskClick, 
  onCreateTask 
}) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const overdueTasks = tasks.filter(task => 
    new Date(task.dueDate) < new Date() && task.status !== 'completed'
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const productivityScore = totalTasks > 0 ? Math.round(((completedTasks + inProgressTasks * 0.5) / totalTasks) * 100) : 0;

  const topTeams = teams
    .map(team => {
      const teamTasks = tasks.filter(task => task.teamId === team.id);
      const completedTeamTasks = teamTasks.filter(task => task.status === 'completed').length;
      const completionRate = teamTasks.length > 0 ? (completedTeamTasks / teamTasks.length) * 100 : 0;
      
      return {
        ...team,
        taskCount: teamTasks.length,
        completedCount: completedTeamTasks,
        completionRate: Math.round(completionRate)
      };
    })
    .filter(team => team.taskCount > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);

  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Overview of tasks and team performance</p>
        </div>
        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
                      <Calendar className="w-4 h-4" />
            New Task
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div key="completion-rate" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        <div key="productivity-score" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productivity Score</p>
              <p className="text-3xl font-bold text-blue-600">{productivityScore}%</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${productivityScore}%` }}
              />
            </div>
          </div>
        </div>

        <div key="active-tasks" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
              <p className="text-3xl font-bold text-orange-600">{inProgressTasks + pendingTasks}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {inProgressTasks} in progress, {pendingTasks} pending
            </p>
        </div>

        <div key="overdue-tasks" className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Tasks</p>
              <p className="text-3xl font-bold text-red-600">{overdueTasks}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Need immediate attention
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Tasks
            </h2>
            <UpcomingTasks tasks={tasks} onTaskClick={onTaskClick} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Top Teams */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Top Teams
              </h3>
            <div className="space-y-3">
              {topTeams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{team.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {team.completedCount}/{team.taskCount} tasks
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{team.completionRate}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Tasks
            </h3>
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {task.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-800' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                                     <p className="text-sm text-gray-500 dark:text-gray-400">
                     {new Date(task.createdAt).toLocaleDateString('en-US')}
                   </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboard; 