import React from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { authService } from '../services/authService';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { address, loading: walletLoading } = useWallet();
  const isAuthenticated = authService.isAuthenticated();

  if (walletLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Connecting to wallet...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated || !address) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 