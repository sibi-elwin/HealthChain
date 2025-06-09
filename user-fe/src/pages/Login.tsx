import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignButton, setShowSignButton] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const { address, loading: walletLoading } = useWallet();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!walletLoading) {
        try {
          if (address) {
            const isValid = await authService.validateToken();
            if (isValid) {
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (err) {
          console.error('Auth check error:', err);
          authService.logout();
        }
        setIsValidating(false);
      }
    };

    checkAuth();
  }, [walletLoading, address, navigate]);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First connect to wallet and get address
      const { address: walletAddress, signer } = await authService.connectWallet();
      console.log('Wallet connected with address:', walletAddress);
      setConnectedAddress(walletAddress);

      // Request nonce from backend for login
      const receivedNonce = await authService.requestNonce(walletAddress, 'login');
      console.log('Received nonce:', receivedNonce);
      setNonce(receivedNonce);
      
      // Show sign button after getting nonce
      setShowSignButton(true);
      
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      // Handle specific error cases
      if (err.message.includes('MetaMask')) {
        setError('Please install MetaMask to use this feature');
      } else if (err.message.includes('User denied')) {
        setError('Please approve the connection request in MetaMask');
      } else {
        setError(err.message || 'Failed to connect wallet');
      }
      setShowSignButton(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignMessage = async () => {
    if (!nonce || !connectedAddress) {
      setError('No nonce or wallet address found. Please connect your wallet first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get signer for the connected wallet using ethers v5 syntax
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to use this feature');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const signer = provider.getSigner();

      // Sign the nonce with wallet
      const signature = await authService.signMessage(signer, nonce);
      console.log('Generated signature:', signature);

      // Verify signature and get token - wait for backend verification
      const token = await authService.verifySignature(connectedAddress, signature, 'login');
      console.log('Signature verified successfully. Token received:', token);

      // Only navigate after successful backend verification and token receipt
      if (token) {
        console.log('Navigating to dashboard after successful verification');
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('No token received from backend verification');
      }

    } catch (err: any) {
      console.error('Signature verification error:', err);
      // Handle specific error cases
      if (err.message.includes('Invalid signature')) {
        setError('Signature verification failed. Please try again.');
      } else if (err.message.includes('User denied')) {
        setError('Please approve the signature request in MetaMask');
      } else if (err.message.includes('Nonce')) {
        setError('Session expired. Please connect your wallet again.');
        setShowSignButton(false);
      } else {
        setError(err.message || 'Failed to verify signature');
      }
      // Reset the sign button if verification fails
      setShowSignButton(false);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          {!showSignButton ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConnectWallet}
              disabled={loading || walletLoading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Connect Wallet'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSignMessage}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Message to Login'}
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Button color="primary" onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 