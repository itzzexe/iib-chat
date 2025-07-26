import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarView.css';
import { Task, CalendarEvent } from '../../types';
import { CalendarDays, Clock, Users, Tag, AlertTriangle } from 'lucide-react';

const locales = {
  'en': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreateTask: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick, onCreateTask }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    const calendarEvents = tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      resource: task,
      className: getTaskClassName(task),
      backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981',
      borderColor: (() => {
        if (task.status === 'completed') return '#10b981';
        if (new Date(task.dueDate) < new Date()) return '#ef4444';
        return '#3b82f6';
      })(),
      extendedProps: {
        priority: task.priority,
        status: task.status,
      }
    } as CalendarEvent));
    setEvents(calendarEvents);
  }, [tasks]);

  const getTaskClassName = (task: Task): string => {
    const priorityClasses: Record<string, string> = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      urgent: 'bg-red-600',
    };
    
    const statusClasses: Record<string, string> = {
      pending: 'border-l-4 border-yellow-400',
      'in-progress': 'border-l-4 border-blue-400',
      in_progress: 'border-l-4 border-blue-400',
      completed: 'border-l-4 border-green-400',
      cancelled: 'border-l-4 border-gray-400',
    };

    return `${priorityClasses[task.priority] || 'bg-gray-500'} ${statusClasses[task.status] || ''} text-white rounded p-1`;
  };

  const eventStyleGetter = (event: any) => {
    const task = event.resource as Task;
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
    
    return {
      className: `${getTaskClassName(task)} ${isOverdue ? 'animate-pulse' : ''}`,
      style: {
        backgroundColor: isOverdue ? '#ef4444' : undefined,
        border: 'none',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '12px',
        fontWeight: '500',
      }
    };
  };

  const handleEventClick = (event: any) => {
    onTaskClick(event.resource);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
            // Add logic to create a new task on the selected date
    onCreateTask();
  };

  const CustomEvent = ({ event }: { event: any }) => {
    const task = event.resource as Task;
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
    
    return (
      <div className="flex flex-col p-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs truncate">{task.title}</span>
          {isOverdue && <AlertTriangle className="w-3 h-3 text-white" />}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Tag size={10} />
          <span className="text-xs capitalize">{task.priority}</span>
        </div>
      </div>
    );
  };

  const CustomToolbar = (toolbar: any) => {
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const goToPrev = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const viewNames = {
      month: 'Month',
      week: 'Week',
      day: 'Day',
    };

    return (
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ‹
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ›
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mr-4">
            {toolbar.label}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['month', 'week', 'day'] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => toolbar.onView(viewType)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  toolbar.view === viewType
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {viewNames[viewType]}
              </button>
            ))}
          </div>
          
          <button
            onClick={onCreateTask}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <CalendarDays size={16} />
            New Task
          </button>
        </div>
      </div>
    );
  };

  // Custom CSS for calendar
  const calendarStyle = {
    height: 'calc(100vh - 200px)',
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-sm h-full">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={calendarStyle}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleEventClick}
          onSelectSlot={handleSelectSlot}
          selectable
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent,
          }}
          messages={{
            next: "Next",
            previous: "Previous",
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
            agenda: "Agenda",
            date: "Date",
            time: "Time",
            event: "Event",
            noEventsInRange: "No tasks in this range",
            showMore: (total: number) => `+${total} more`,
            yesterday: "Yesterday",
            tomorrow: "Tomorrow",
            allDay: "All Day",
          }}
          culture="en"
                      formats={{
              dayRangeHeaderFormat: ({ start, end }: any) => 
                `${format(start, 'MM/dd', { locale: enUS })} - ${format(end, 'MM/dd', { locale: enUS })}`,
              monthHeaderFormat: 'MMMM yyyy',
            }}
        />
      </div>
    </div>
  );
};

export default CalendarView; 