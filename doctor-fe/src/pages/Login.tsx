import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { Wallet, Shield, ArrowRight } from 'lucide-react';

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
          // Only validate token if one exists
          const token = authService.getToken();
          if (token && address) {
            const isValid = await authService.validateToken();
            if (isValid) {
              navigate('/dashboard', { replace: true });
            } else {
              // Clear invalid token
              authService.logout();
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
      setError(err.message || 'Failed to connect wallet');
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

      // Get signer for the connected wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

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
      setError(err.message || 'Failed to verify signature');
      // Reset the sign button if verification fails
      setShowSignButton(false);
    } finally {
      setLoading(false);
    }
  };

  if (walletLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Doctor Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect your wallet to access medical records
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {!showSignButton ? (
              <button
                onClick={handleConnectWallet}
                disabled={loading || walletLoading}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
                <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            ) : (
              <button
                onClick={handleSignMessage}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Shield className="h-5 w-5" />
                )}
                <span>{loading ? 'Signing...' : 'Sign Message to Login'}</span>
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Register Here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 