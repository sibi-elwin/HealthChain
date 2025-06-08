import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { authService } from '../services/authService';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

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

  useEffect(() => {
    if (userAddress) {
      setStats({
        totalRecords: 5,
        pendingRequests: 2,
        unreadNotifications: 3,
      });
    }
  }, [userAddress]);

  if (walletLoading) {
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
      title: 'View Records',
      description: 'Access and manage your medical records',
      icon: <ViewIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/medical-records-access'),
    },
    {
      title: 'Access Requests',
      description: 'Review pending access requests from patients',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/access-requests'),
    },
    {
      title: 'Notifications',
      description: 'View your unread notifications',
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
        Welcome, Doctor!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Total Records Accessible
            </Typography>
            <Typography variant="h3">{stats.totalRecords}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              Pending Access Requests
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

      <Typography variant="h5" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.title}>
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