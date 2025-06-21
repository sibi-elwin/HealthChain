import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { authService } from '../services/authService';

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
          const token = authService.getToken();
          if (token && address) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isValid || !address) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 