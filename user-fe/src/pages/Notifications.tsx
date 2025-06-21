import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import { AccessRequestList } from '../components/AccessRequestList';
import { authService } from '../services/authService';
import { Bell, Clock, CheckCircle, XCircle } from 'lucide-react';

interface NotificationsProps {
  onLogout: () => void;
}

export default function Notifications({ onLogout }: NotificationsProps) {
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await authService.getNotifications();
        // Filter notifications to only show access request related ones
        const accessRequestNotifications = response.notifications.filter(
          (notification: any) => 
            notification.type === 'ACCESS_REQUEST' || 
            notification.type === 'ACCESS_REQUEST_APPROVED' || 
            notification.type === 'ACCESS_REQUEST_REJECTED'
        );
        setNotifications(accessRequestNotifications);
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
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading wallet connection...</p>
        </div>
      </Layout>
    );
  }

  if (!userAddress) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Wallet Connection Required
            </h2>
            <p className="text-gray-600">
              Please connect your wallet to view notifications
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="mb-8">
        <h1 className="heading-2 text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">Manage your access requests and notifications</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="card">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Requests
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Access Request History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'requests' && (
          <div>
            <AccessRequestList />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {loadingNotifications ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any access request notifications yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.read 
                        ? 'bg-white border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {notification.type === 'ACCESS_REQUEST_APPROVED' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {notification.type === 'ACCESS_REQUEST_REJECTED' && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          {notification.type === 'ACCESS_REQUEST' && (
                            <Clock className="h-5 w-5 text-blue-600" />
                          )}
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 