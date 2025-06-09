import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import { AccessRequestList } from '../components/AccessRequestList';
import { authService } from '../services/authService';

interface NotificationsProps {
  onLogout: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Notifications({ onLogout }: NotificationsProps) {
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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

      <Paper elevation={3}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="notifications tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Access Requests" />
          <Tab label="Access Request History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <AccessRequestList />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loadingNotifications ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Typography>No access request notifications</Typography>
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
        </TabPanel>
      </Paper>
    </Layout>
  );
} 