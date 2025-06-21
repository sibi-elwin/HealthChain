import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import { AccessRequestForm } from '../components/AccessRequestForm';
import {
  Eye as ViewIcon,
  Users as PeopleIcon,
  Bell as NotificationsIcon,
  FileText as RecordsIcon,
  Clock as PendingIcon,
  MessageSquare as NotificationIcon,
  Stethoscope as MedicalIcon,
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { address: userAddress, loading: walletLoading } = useWallet();
  const [stats, setStats] = useState({
    totalRecords: 0,
    pendingRequests: 0,
    unreadNotifications: 0,
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [patientAddress, setPatientAddress] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (userAddress) {
          // For now, using mock data - replace with actual API call
          setStats({
            totalRecords: 5,
            pendingRequests: 2,
            unreadNotifications: 3,
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError('Failed to load dashboard statistics');
      }
    };

    fetchStats();
    // Refresh stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [userAddress]);

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientAddress) {
      setShowRequestForm(true);
    }
  };

  if (walletLoading) {
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
              Please connect your wallet to manage medical records
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (showRequestForm) {
    return (
      <Layout onLogout={onLogout}>
        <div className="mt-8">
          {!patientAddress ? (
            <div className="max-w-2xl mx-auto card">
              <h2 className="text-xl font-semibold mb-4">Enter Patient's Wallet Address</h2>
              <form onSubmit={handleSubmitAddress}>
                <input
                  type="text"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  required
                  placeholder="0x..."
                  className="input-field"
                />
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!patientAddress.trim()}
                    className="btn-primary"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <AccessRequestForm
              patientAddress={patientAddress}
              onSuccess={() => {
                setShowRequestForm(false);
                setPatientAddress('');
              }}
              onCancel={() => {
                setShowRequestForm(false);
                setPatientAddress('');
              }}
            />
          )}
        </div>
      </Layout>
    );
  }

  const quickActions = [
    {
      title: 'View Records',
      description: 'Access and manage patient medical records',
      icon: <ViewIcon className="w-10 h-10 text-green-600" />,
      action: () => navigate('/medical-records-access'),
      color: 'bg-green-50 hover:bg-green-100',
    },
    {
      title: 'Request Access',
      description: 'Request access to patient records',
      icon: <PeopleIcon className="w-10 h-10 text-blue-600" />,
      action: () => setShowRequestForm(true),
      color: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      title: 'Notifications',
      description: 'View your pending requests and notifications',
      icon: <NotificationsIcon className="w-10 h-10 text-purple-600" />,
      action: () => navigate('/notifications'),
      color: 'bg-purple-50 hover:bg-purple-100',
    },
  ];

  return (
    <Layout onLogout={onLogout}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="heading-2 text-gray-900 mb-2">Welcome, Doctor!</h1>
        <p className="text-gray-600">Manage patient medical records securely on the blockchain</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <RecordsIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Records Accessible</h3>
          <p className="text-3xl font-bold text-primary-600">{stats.totalRecords}</p>
        </div>
        
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <PendingIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Access Requests</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</p>
        </div>
        
        <div className="card text-center">
          <div className="flex justify-center mb-4">
            <NotificationIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Unread Notifications</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.unreadNotifications}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="heading-3 text-gray-900 mb-4">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <div key={action.title} className="card group cursor-pointer transition-all duration-200 hover:shadow-xl" onClick={action.action}>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-colors ${action.color}`}>
                {action.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600 mb-4">{action.description}</p>
              <button className="btn-primary w-full">
                {action.title}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
} 