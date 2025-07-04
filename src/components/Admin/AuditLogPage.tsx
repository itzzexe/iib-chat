import React, { useEffect, useState } from 'react';
import { BookCopy, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import dataService from '../../services/dataService';
import { format } from 'date-fns';

export default function AuditLogPage() {
  const { setCurrentScreen } = useApp();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = (page = 1) => {
    setLoading(true);
    dataService.getAuditLogs(page)
      .then(data => {
        setLogs(data.data);
        setPagination(data.pagination);
      })
      .catch(err => console.error("Failed to load audit logs", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-secondary-900">
      <div className="flex items-center gap-4 p-6 border-b border-secondary-200 dark:border-secondary-700">
        <button onClick={() => setCurrentScreen('chat')} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Audit Log</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p>Loading logs...</p>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log._id} className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg text-sm">
                <p><strong>Action:</strong> {log.action}</p>
                <p><strong>Actor:</strong> {log.actorId.name} ({log.actorId.email})</p>
                <p><strong>Target ID:</strong> {log.targetId}</p>
                <p><strong>Details:</strong> {JSON.stringify(log.details)}</p>
                <p className="text-xs text-secondary-500 mt-1">{format(new Date(log.createdAt), 'MMM d, yyyy, h:mm a')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 