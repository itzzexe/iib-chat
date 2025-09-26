import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Clock, 
  Users, 
  Calendar,
  Trash2,
  Download,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { CallHistory as CallHistoryType } from '../../types';
import dataServiceAPI from '../../services/dataService';
import toast from 'react-hot-toast';

interface CallHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const CallHistory: React.FC<CallHistoryProps> = ({ isOpen, onClose }) => {
  const [callHistory, setCallHistory] = useState<CallHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCallHistory();
    }
  }, [isOpen]);

  const loadCallHistory = async () => {
    setLoading(true);
    try {
      const history = await dataServiceAPI.getCallHistory();
      setCallHistory(history);
    } catch (error) {
      console.error('Failed to load call history:', error);
      toast.error('Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const deleteCallRecord = async (callId: string) => {
    try {
      await dataServiceAPI.deleteCallRecord(callId);
      setCallHistory(prev => prev.filter(call => call.id !== callId));
      toast.success('Call record deleted');
    } catch (error) {
      console.error('Failed to delete call record:', error);
      toast.error('Failed to delete call record');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'missed':
        return 'text-red-500';
      case 'rejected':
        return 'text-orange-500';
      case 'ongoing':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'missed':
        return 'Missed';
      case 'rejected':
        return 'Rejected';
      case 'ongoing':
        return 'Ongoing';
      default:
        return status;
    }
  };

  const filteredHistory = callHistory
    .filter(call => {
      if (filter === 'incoming') return call.isIncoming;
      if (filter === 'outgoing') return !call.isIncoming;
      return true;
    })
    .filter(call => 
      call.chatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.participantNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <Phone className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Call History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'all' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('incoming')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'incoming' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 inline mr-1" />
                Incoming
              </button>
              <button
                onClick={() => setFilter('outgoing')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === 'outgoing' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 inline mr-1" />
                Outgoing
              </button>
            </div>
            
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading call history...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <Phone className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No calls found</p>
              <p className="text-sm">All your previous calls will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredHistory.map((call) => (
                <div key={call.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Call Type Icon */}
                      <div className={`p-2 rounded-full ${
                        call.callType === 'video' ? 'bg-blue-100' : 'bg-green-100'
                      }`}>
                        {call.callType === 'video' ? (
                          <Video className={`w-5 h-5 ${call.callType === 'video' ? 'text-blue-600' : 'text-green-600'}`} />
                        ) : (
                          <Phone className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      {/* Call Direction Icon */}
                      <div className={`p-1 rounded-full ${
                        call.isIncoming ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {call.isIncoming ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-600" />
                        )}
                      </div>

                      {/* Call Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {call.chatName}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(call.status)}`}>
                            {getStatusText(call.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{call.participantNames.join(', ')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(call.duration)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(call.startTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {call.hasRecording && (
                        <button
                          onClick={() => window.open(call.recordingUrl, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Download recording"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteCallRecord(call.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total calls: {filteredHistory.length}</span>
            <button
              onClick={loadCallHistory}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHistory; 