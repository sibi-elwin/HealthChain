import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import { authService } from '../services/authService';
import { Bell, Clock } from 'lucide-react';

interface NotificationsProps {
  onLogout: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export default function Notifications({ onLogout }: NotificationsProps) {
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await authService.getNotifications();
        setNotifications(response.notifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoadingNotifications(false);
      }
    };

    if (userAddress) {
      fetchNotifications();
      // Refresh notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userAddress]);

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Loading wallet connection...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userAddress) {
    return (
      <Layout onLogout={onLogout}>
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Wallet not connected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please connect your wallet to view notifications
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Bell className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="card">
          {loadingNotifications ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-2 ${
                        notification.read ? 'text-gray-900' : 'text-blue-900'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mb-2 ${
                        notification.read ? 'text-gray-600' : 'text-blue-700'
                      }`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="ml-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 