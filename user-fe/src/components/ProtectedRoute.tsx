import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { authService } from '../services/authService';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { address, loading: walletLoading } = useWallet();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      if (!walletLoading) {
        try {
          if (address) {
            const isValid = await authService.validateToken();
            setIsValid(isValid);
            if (!isValid) {
              authService.logout();
            }
          } else {
            setIsValid(false);
          }
        } catch (err) {
          console.error('Auth validation error:', err);
          setIsValid(false);
          authService.logout();
        }
        setIsValidating(false);
      }
    };

    validateAuth();
  }, [walletLoading, address]);

  // Show loading state only when either wallet is loading or we're validating
  if (walletLoading || isValidating) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="h6">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!isValid || !address) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 