import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import { authService } from '../services/authService';

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
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading wallet connection...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!userAddress) {
    return (
      <Layout onLogout={onLogout}>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Please connect your wallet to view notifications
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        {loadingNotifications ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Typography>No notifications</Typography>
        ) : (
          <Box>
            {notifications.map((notification) => (
              <Paper
                key={notification.id}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: notification.read ? 'inherit' : 'action.hover'
                }}
              >
                <Typography variant="h6">{notification.title}</Typography>
                <Typography variant="body1">{notification.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>
    </Layout>
  );
} 