import React from 'react';
import { Clock, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Task } from '../../types';

interface UpcomingTasksProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const UpcomingTasks: React.FC<UpcomingTasksProps> = ({ tasks, onTaskClick }) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDay.getTime() === today.getTime() && task.status !== 'completed';
  });

  const tomorrowTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
    return taskDay.getTime() === tomorrow.getTime() && task.status !== 'completed';
  });

  const thisWeekTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= tomorrow && taskDate <= nextWeek && task.status !== 'completed';
  });

  const overdueTasks = tasks.filter(task => 
    new Date(task.dueDate) < today && task.status !== 'completed'
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-400" />;
    }
  };

  const TaskItem = ({ task, isOverdue = false }: { task: Task; isOverdue?: boolean }) => (
    <div
      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onTaskClick(task)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getStatusIcon(task.status)}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {task.title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isOverdue && (
          <AlertTriangle className="w-4 h-4 text-red-500" />
        )}
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Overdue Tasks ({overdueTasks.length})
          </h3>
          <div className="space-y-2">
            {overdueTasks.slice(0, 5).map(task => (
              <TaskItem key={task.id} task={task} isOverdue={true} />
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Today's Tasks ({todayTasks.length})
          </h3>
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow's Tasks */}
      {tomorrowTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Tomorrow's Tasks ({tomorrowTasks.length})
          </h3>
          <div className="space-y-2">
            {tomorrowTasks.slice(0, 5).map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* This Week's Tasks */}
      {thisWeekTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            This Week's Tasks ({thisWeekTasks.length})
          </h3>
          <div className="space-y-2">
            {thisWeekTasks.slice(0, 5).map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* No upcoming tasks */}
      {overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0 && thisWeekTasks.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No upcoming tasks
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All tasks are completed or no tasks scheduled for this week
          </p>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks; 