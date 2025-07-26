import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Calendar,
  User,
  Activity,
  Clock,
  Eye,
  Trash2,
  Shield,
  MessageSquare,
  Users,
  Bell,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import dataServiceAPI from '../../services/dataService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AuditLog {
  _id: string;
  action: string;
  actorId: {
    _id: string;
    name: string;
    email: string;
  };
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function AuditLogPage() {
  const { setCurrentScreen } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('all');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    thisWeekLogs: 0,
    topActions: []
  });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      // If showAllLogs is true, fetch with a large limit to get all logs
      const limit = showAllLogs ? 1000 : 20;
      const data = await dataServiceAPI.getAuditLogs(page, limit);
        setLogs(data.logs || []);
      setPagination(showAllLogs ? null : data.pagination);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const allLogs = data.logs || [];
      const todayLogs = allLogs.filter(log => new Date(log.createdAt) >= today).length;
      const thisWeekLogs = allLogs.filter(log => new Date(log.createdAt) >= weekAgo).length;
      
      // Count action types
      const actionCounts = {};
      allLogs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });
      
      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));
      
      setStats({
        totalLogs: data.pagination?.totalCount || 0,
        todayLogs,
        thisWeekLogs,
        topActions
      });
    } catch (error) {
      console.error("Failed to load audit logs", error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [showAllLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user.login':
        return <Shield className="w-4 h-4 text-blue-500" />;
      case 'user.role.updated':
        return <Settings className="w-4 h-4 text-purple-500" />;
      case 'user.deleted':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'user.approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'user.rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'chat.created':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'chat.deleted':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'chat.cleared':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'message.sent':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'message.deleted':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'broadcast.sent':
        return <Bell className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'user.login':
        return 'User Login';
      case 'user.role.updated':
        return 'Role Updated';
      case 'user.deleted':
        return 'User Deleted';
      case 'user.approved':
        return 'User Approved';
      case 'user.rejected':
        return 'User Rejected';
      case 'chat.created':
        return 'Chat Created';
      case 'chat.deleted':
        return 'Chat Deleted';
      case 'chat.cleared':
        return 'Chat Cleared';
      case 'message.sent':
        return 'Message Sent';
      case 'message.deleted':
        return 'Message Deleted';
      case 'broadcast.sent':
        return 'Broadcast Sent';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'user.login':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'user.role.updated':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'user.deleted':
      case 'user.rejected':
      case 'chat.deleted':
      case 'message.deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'user.approved':
      case 'message.sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'chat.created':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'chat.cleared':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'broadcast.sent':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDetails = (details: Record<string, unknown>) => {
    if (!details || Object.keys(details).length === 0) {
      return 'No additional details';
    }
    
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(', ');
  };

  const filteredLogs = (logs || []).filter(log => {
    const matchesSearch = 
      (log.actorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (log.actorId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      getActionLabel(log.action).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = !actionFilter || log.action === actionFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(log.createdAt), 'yyyy-MM-dd') === dateFilter;
    
    // Time range filter
    const logDate = new Date(log.createdAt);
    const now = new Date();
    let matchesTimeRange = true;
    
    switch (timeRangeFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesTimeRange = logDate >= today;
        break;
      case 'yesterday':
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchesTimeRange = logDate >= yesterday && logDate < todayStart;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesTimeRange = logDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchesTimeRange = logDate >= monthAgo;
        break;
      default:
        matchesTimeRange = true;
    }
    
    return matchesSearch && matchesAction && matchesDate && matchesTimeRange;
  });

  const exportLogs = () => {
    const csvContent = [
      'Action,Actor,Target ID,Details,Timestamp',
      ...filteredLogs.map(log => [
        getActionLabel(log.action),
        `${log.actorId?.name || 'Unknown User'} (${log.actorId?.email || 'No email'})`,
        log.targetId,
        formatDetails(log.details),
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Audit logs exported successfully');
  };

  const exportLogsJSON = () => {
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalLogs: filteredLogs.length,
      logs: filteredLogs.map(log => ({
        id: log._id,
        action: getActionLabel(log.action),
        actionCode: log.action,
        actor: {
          name: log.actorId?.name || 'Unknown User',
          email: log.actorId?.email || 'No email'
        },
        targetId: log.targetId,
        details: log.details,
        timestamp: log.createdAt,
        formattedDate: format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')
      }))
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Audit logs exported as JSON successfully');
  };

  const exportStats = () => {
    const statsData = {
      exportDate: new Date().toISOString(),
      stats: {
        totalLogs: stats.totalLogs,
        todayLogs: stats.todayLogs,
        thisWeekLogs: stats.thisWeekLogs,
        topActions: stats.topActions.map(item => ({
          action: getActionLabel(item.action),
          actionCode: item.action,
          count: item.count
        }))
      },
      filters: {
        searchTerm,
        actionFilter,
        dateFilter,
        timeRangeFilter
      }
    };
    
    const blob = new Blob([JSON.stringify(statsData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-stats-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Audit statistics exported successfully');
  };



  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Audit Log Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .action-badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; }
            .action-login { background-color: #dbeafe; color: #1e40af; }
            .action-deleted { background-color: #fee2e2; color: #dc2626; }
            .action-created { background-color: #dcfce7; color: #16a34a; }
            .action-updated { background-color: #f3e8ff; color: #7c3aed; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Audit Log Report</h1>
            <p>Generated on ${format(new Date(), 'MMM d, yyyy, h:mm a')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${stats.totalLogs}</div>
              <div class="stat-label">Total Logs</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.todayLogs}</div>
              <div class="stat-label">Today</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.thisWeekLogs}</div>
              <div class="stat-label">This Week</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${filteredLogs.length}</div>
              <div class="stat-label">Filtered Results</div>
            </div>
          </div>
          
          <h2>Audit Log Entries</h2>
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target ID</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLogs.map(log => `
                <tr>
                  <td>
                    <span class="action-badge action-${log.action.split('.')[1] || 'default'}">
                      ${getActionLabel(log.action)}
                    </span>
                  </td>
                  <td>${log.actorId.name} (${log.actorId.email})</td>
                  <td>${log.targetId}</td>
                  <td>${format(new Date(log.createdAt), 'MMM d, yyyy, h:mm a')}</td>
                  <td>${Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : 'No details'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 500);
    
    toast.success('PDF export ready for printing');
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900 h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentScreen('chat')} 
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
          >
          <ArrowLeft className="w-5 h-5" />
        </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Audit Log</h1>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Track and monitor system activities
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showAllLogs 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-secondary-600 text-white hover:bg-secondary-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            {showAllLogs ? 'Show Paginated' : 'Show All Logs'}
          </button>
          <button
            onClick={async () => {
              try {
                await dataServiceAPI.createSampleAuditLogs();
                toast.success('Sample audit logs created successfully');
                fetchLogs();
              } catch (error) {
                toast.error('Failed to create sample logs');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Activity className="w-4 h-4" />
            Create Sample Data
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
                try {
                  await dataServiceAPI.clearAuditLogs();
                  toast.success('All audit logs cleared successfully');
                  fetchLogs();
                } catch (error) {
                  toast.error('Failed to clear audit logs');
                }
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={exportLogsJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={exportStats}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart className="w-4 h-4" />
            Export Stats
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => fetchLogs()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Logs</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalLogs}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Today</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.todayLogs}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">This Week</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.thisWeekLogs}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Top Action</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {stats.topActions[0] ? getActionLabel(stats.topActions[0].action) : 'None'}
                </p>
              </div>
              <BarChart className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="">All Actions</option>
              <option value="user.login">User Login</option>
              <option value="user.role.updated">Role Updated</option>
              <option value="user.deleted">User Deleted</option>
              <option value="user.approved">User Approved</option>
              <option value="user.rejected">User Rejected</option>
              <option value="chat.created">Chat Created</option>
              <option value="chat.deleted">Chat Deleted</option>
              <option value="chat.cleared">Chat Cleared</option>
              <option value="message.sent">Message Sent</option>
              <option value="message.deleted">Message Deleted</option>
              <option value="broadcast.sent">Broadcast Sent</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />

            <select
              value={timeRangeFilter}
              onChange={(e) => setTimeRangeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setActionFilter('');
                setDateFilter('');
                setTimeRangeFilter('all');
              }}
              className="px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="audit-log-content flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100 dark:scrollbar-thumb-secondary-600 dark:scrollbar-track-secondary-800 relative">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-secondary-600 dark:text-secondary-400">Loading audit logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-secondary-500 dark:text-secondary-400">
            <Activity className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm">
              {searchTerm || actionFilter || dateFilter 
                ? 'Try adjusting your search or filters'
                : 'Audit logs will appear here as activities occur'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map(log => (
              <div 
                key={log._id} 
                className="bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedLog(log);
                  setShowLogDetails(true);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-full bg-secondary-100 dark:bg-secondary-700">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-secondary-600 dark:text-secondary-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{log.actorId?.name || 'Unknown User'}</span>
                          <span className="text-xs">({log.actorId?.email || 'No email'})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>Target: {log.targetId}</span>
                        </div>
                        
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="flex items-start gap-2">
                            <Activity className="w-4 h-4 mt-0.5" />
                            <span className="text-xs bg-secondary-50 dark:bg-secondary-700 px-2 py-1 rounded">
                              {formatDetails(log.details)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-secondary-500 dark:text-secondary-400">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(log.createdAt), 'MMM d, yyyy')}</span>
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(log.createdAt), 'h:mm a')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {pagination && !showAllLogs && (
        <div className="p-6 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
            <span>
              Showing {filteredLogs.length} of {pagination.totalCount} logs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      
            {/* Show All Logs Footer */}
      {showAllLogs && (
        <div className="p-6 border-t border-secondary-200 dark:border-secondary-700">
          <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
            <span>
              Showing all {filteredLogs.length} logs
            </span>
            <span className="text-xs text-secondary-500">
              Use filters to narrow down results
            </span>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {showLogDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100 dark:scrollbar-thumb-secondary-600 dark:scrollbar-track-secondary-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Audit Log Details
              </h3>
              <button
                onClick={() => setShowLogDetails(false)}
                className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                    Action
                  </label>
                  <div className="flex items-center gap-2">
                    {getActionIcon(selectedLog.action)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                      {getActionLabel(selectedLog.action)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                    Timestamp
                  </label>
                  <p className="text-sm text-secondary-900 dark:text-white">
                    {format(new Date(selectedLog.createdAt), 'MMM d, yyyy, h:mm:ss a')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                    Actor
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-secondary-500" />
                    <span className="text-sm text-secondary-900 dark:text-white">
                      {selectedLog.actorId?.name || 'Unknown User'} ({selectedLog.actorId?.email || 'No email'})
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                    Target ID
                  </label>
                  <p className="text-sm text-secondary-900 dark:text-white font-mono">
                    {selectedLog.targetId}
                  </p>
                </div>
              </div>
              
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-2">
                    Details
                  </label>
                  <div className="bg-secondary-50 dark:bg-secondary-700 rounded-lg p-3">
                    <pre className="text-xs text-secondary-900 dark:text-white whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                  Log ID
                </label>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 font-mono flex-1">
                    {selectedLog._id}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLog._id);
                      toast.success('Log ID copied to clipboard');
                    }}
                    className="px-2 py-1 bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-400 rounded text-xs hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  const logData = {
                    id: selectedLog._id,
                    action: getActionLabel(selectedLog.action),
                    actionCode: selectedLog.action,
                    actor: {
                      name: selectedLog.actorId?.name || 'Unknown User',
                      email: selectedLog.actorId?.email || 'No email'
                    },
                    targetId: selectedLog.targetId,
                    details: selectedLog.details,
                    timestamp: selectedLog.createdAt,
                    formattedDate: format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')
                  };
                  
                  const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit-log-${selectedLog._id}.json`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  toast.success('Log exported successfully');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Export Log
              </button>
              <button
                onClick={() => setShowLogDetails(false)}
                className="px-4 py-2 bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 