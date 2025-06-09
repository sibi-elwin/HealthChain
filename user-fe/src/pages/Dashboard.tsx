import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { authService } from '../services/authService';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalRecords: 0,
    pendingRequests: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await authService.getDashboardStats();
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError('Failed to load dashboard statistics');
      }
    };

    if (userAddress) {
      fetchStats();
      // Refresh stats every minute
      const interval = setInterval(fetchStats, 60000);
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
            Please connect your wallet to manage medical records
          </Typography>
        </Box>
      </Layout>
    );
  }

  const quickActions = [
    {
      title: 'Upload Medical Record',
      description: 'Add a new medical record to your profile',
      icon: <AddIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/medical-records/upload'),
    },
    {
      title: 'View Records',
      description: 'Access and manage your medical records',
      icon: <ViewIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/medical-records'),
    },
    {
      title: 'Notifications',
      description: 'View your pending requests and notifications',
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/notifications'),
    },
  ];

  return (
    <Layout onLogout={onLogout}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom>
        Welcome to HealthChain
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Total Records
            </Typography>
            <Typography variant="h3">{stats.totalRecords}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Pending Requests
            </Typography>
            <Typography variant="h3">{stats.pendingRequests}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Unread Notifications
            </Typography>
            <Typography variant="h3">{stats.unreadNotifications}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={4} key={action.title}>
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={action.action}
                >
                  {action.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Layout>
  );
} 