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
  Divider,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { authService } from '../services/authService';
import { UserCredentials } from '../types/user';
import { useNavigate } from 'react-router-dom';
import { ethers, Signer } from 'ethers';
import { useWallet } from '../hooks/useWallet';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCredentials>({
    name: '',     
    email: '',        
    walletAddress: '',
    phoneNumber: '',
    dob: '',
    gender: '',
    allergies: '',
    bloodGroup: '',
    emergencyContact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signer, setSigner] = useState<Signer | null>(null);
  const { address, loading: walletLoading } = useWallet();

  useEffect(() => {
    if (!walletLoading && authService.isAuthenticated() && address) {
      navigate('/dashboard', { replace: true });
    }
  }, [walletLoading, address, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = date.toLocaleDateString('en-CA');
      setFormData(prev => ({
        ...prev,
        dob: formattedDate,
      }));
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { address: connectedAddress, signer: connectedSigner } = await authService.connectWallet();
      console.log('Wallet connected, address:', connectedAddress);
      
      setFormData(prev => ({
        ...prev,
        walletAddress: connectedAddress,
      }));
      
      const nonce = await authService.requestNonce(connectedAddress, 'wallet_connection');
      console.log('Received nonce:', nonce);
      
      const signature = await authService.signMessage(connectedSigner, nonce);
      console.log('Generated signature:', signature);
      
      await authService.verifySignature(connectedAddress, signature, 'wallet_connection', nonce);
      console.log('Wallet connection verified');
      
      setSigner(connectedSigner);
      setSuccess(true);
      
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      if (!formData.name || !formData.email || !formData.dob || 
          !formData.gender || !formData.walletAddress) {
        const missingFields = [];
        if (!formData.name) missingFields.push('Name');
        if (!formData.email) missingFields.push('Email');
        if (!formData.dob) missingFields.push('Date of Birth');
        if (!formData.gender) missingFields.push('Gender');
        if (!formData.walletAddress) missingFields.push('Wallet Address');
        
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      if (!signer) {
        throw new Error('Please connect your wallet first');
      }

      const registrationNonce = await authService.requestNonce(formData.walletAddress, 'registration');
      console.log('Received registration nonce:', registrationNonce);

      const registrationSignature = await authService.signMessage(signer, registrationNonce);
      console.log('Generated registration signature');

      if (!registrationSignature) {
        throw new Error('Signature is required to derive public key.');
      }

      const messageHash = ethers.utils.hashMessage(registrationNonce);
      const publicKey = ethers.utils.recoverPublicKey(messageHash, registrationSignature);
      console.log('Derived public key from signature:', publicKey);

      const registrationData = {
        ...formData,
        signature: registrationSignature,
        publicKey: publicKey
      };

      console.log('Submitting registration with data:', registrationData);

      const response = await authService.register(registrationData);
      
      console.log('Registration successful:', response);
      setSuccess(true);
      
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (walletLoading || (authService.isAuthenticated() && address)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Sign Up
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Wallet connected successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <DatePicker
              label="Date of Birth"
              value={formData.dob ? new Date(formData.dob) : null}
              onChange={(date) => {
                if (date) {
                  setFormData(prev => ({
                    ...prev,
                    dob: date.toISOString()
                  }));
                }
              }}
              sx={{ width: '100%', mt: 2, mb: 1 }}
            />

            <TextField
              fullWidth
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Blood Group (Optional)"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleInputChange}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Allergies (Optional)"
              name="allergies"
              value={formData.allergies}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Emergency Contact (Optional)"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              margin="normal"
            />

            <Box sx={{ mt: 3, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={connectWallet}
                disabled={loading || !!formData.walletAddress}
                fullWidth
              >
                {formData.walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading || !formData.walletAddress}
              sx={{ mt: 2 }}
            >
              {loading ? 'Uploading...' : 'Register'}
            </Button>
          </form>
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default Signup; 