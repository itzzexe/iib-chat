import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare, Briefcase } from 'lucide-react';
import dataService from '../../services/dataService';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow-sm flex items-center gap-4">
    <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-secondary-500 dark:text-secondary-400">{title}</p>
      <p className="text-2xl font-bold text-secondary-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const BroadcastForm = () => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await dataService.sendBroadcast(message);
      toast.success('Broadcast sent successfully!');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send broadcast.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">Send a Broadcast</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Announce something to all users..."
          className="w-full p-2 border rounded-lg dark:bg-secondary-700 dark:border-secondary-600"
          rows={3}
          required
        />
        <button
          type="submit"
          disabled={isSending}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:bg-red-400"
        >
          {isSending ? 'Sending...' : 'Send Broadcast'}
        </button>
      </form>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.getDashboardStats()
      .then(data => setStats(data))
      .catch(err => console.error("Failed to load dashboard stats", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-center">Could not load dashboard data.</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-primary-600" />} />
        <StatCard title="Online Users" value={stats.onlineUsers} icon={<Users className="w-6 h-6 text-green-500" />} />
        <StatCard title="Total Chats" value={stats.totalChats} icon={<Briefcase className="w-6 h-6 text-yellow-500" />} />
        <StatCard title="Total Messages" value={stats.totalMessages} icon={<MessageSquare className="w-6 h-6 text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold mb-4">Messages - Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.messagesLast7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <BroadcastForm />
      </div>

      <div className="bg-white dark:bg-secondary-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Top 5 Active Users</h2>
        <ul className="space-y-2">
          {stats.topUsers.map((user, index) => (
            <li key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700">
              <span className="font-medium">{user.name}</span>
              <span className="font-bold text-primary-600">{user.count} messages</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 