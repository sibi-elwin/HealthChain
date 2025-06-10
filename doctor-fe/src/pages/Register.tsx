import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { authService } from '../services/authService';
import { ethers ,SigningKey} from 'ethers';
import { useNavigate } from 'react-router-dom';


export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    walletAddress: '',
    phoneNumber: '',
    specialization: '',
    licenseNumber: '',
    hospital: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (authService.isAuthenticated() && authService.getToken()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Step 1: Connect to wallet and get address
      console.log('Step 1: Connecting to wallet...');
      const { address: connectedAddress, signer } = await authService.connectWallet();
      console.log('Wallet connected, address:', connectedAddress);
      
      // Update form with wallet address
      setFormData(prev => ({
        ...prev,
        walletAddress: connectedAddress,
      }));
      
      // Step 2: Request nonce from backend
      console.log('Step 2: Requesting nonce...');
      const nonce = await authService.requestNonce(connectedAddress, 'wallet_connection');
      console.log('Received nonce:', nonce);
      
      // Step 3: Sign the nonce with wallet
      console.log('Step 3: Signing nonce...');
      const signature = await authService.signMessage(signer, nonce);
      console.log('Generated signature:', signature);
      
      // Step 4: Verify signature and get token
      console.log('Step 4: Verifying signature...');
      const { verified } = await authService.verifySignature(connectedAddress, signature, 'wallet_connection');
      if (!verified) {
        throw new Error('Signature verification failed');
      }
      console.log('Signature verified successfully');
      
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
      setError('');
      
      // Validate form data
      if (!formData.name || !formData.email || !formData.specialization || 
          !formData.licenseNumber || !formData.walletAddress || !formData.phoneNumber) {
        const missingFields = [];
        if (!formData.name) missingFields.push('Name');
        if (!formData.email) missingFields.push('Email');
        if (!formData.specialization) missingFields.push('Specialization');
        if (!formData.licenseNumber) missingFields.push('License Number');
        if (!formData.walletAddress) missingFields.push('Wallet Address');
        if (!formData.phoneNumber) missingFields.push('Phone Number');
        
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      if (!success) {
        throw new Error('Please connect your wallet first');
      }

      // Get wallet connection for signing
      console.log('Getting wallet connection for registration...');
      const { signer } = await authService.connectWallet();

      // Request a new nonce specifically for registration
      console.log('Requesting registration nonce...');
      const registrationNonce = await authService.requestNonce(formData.walletAddress, 'registration');
      console.log('Received registration nonce:', registrationNonce);

      // Sign the registration nonce
      console.log('Signing registration nonce...');
      const registrationSignature = await authService.signMessage(signer, registrationNonce);
      console.log('Generated registration signature:', registrationSignature);

      // Get the public key from the signer
      console.log('Deriving public key...');
      const messageHash = ethers.hashMessage(registrationNonce);
      const publicKey = SigningKey.recoverPublicKey(messageHash, registrationSignature);
      console.log('Derived public key:', publicKey);

      // Verify the registration signature
      console.log('Verifying registration signature...');
      const { token, verified } = await authService.verifySignature(formData.walletAddress, registrationSignature, 'registration');
      if (!verified) {
        throw new Error('Registration signature verification failed');
      }
      console.log('Registration signature verified successfully');

      // Prepare registration data with the new signature and public key
      const registrationData = {
        ...formData,
        signature: registrationSignature,
        publicKey,
        nonce: registrationNonce
      };

      console.log('Registration data details:', {
        name: registrationData.name,
        email: registrationData.email,
        walletAddress: registrationData.walletAddress,
        specialization: registrationData.specialization,
        licenseNumber: registrationData.licenseNumber,
        phoneNumber: registrationData.phoneNumber,
        signature: registrationSignature,
        publicKey: publicKey,
        nonce: registrationNonce
      });

      // Register doctor with backend
      const { doctor } = await authService.register(registrationData);
      
      console.log('Registration successful:', doctor);
      navigate('/dashboard', { replace: true }); // Redirect after successful registration
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner if user is already authenticated
  if (authService.isAuthenticated() && authService.getToken()) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Doctor Registration
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              Wallet connected successfully!
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phoneNumber"
              label="Phone Number"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="specialization"
              label="Specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="licenseNumber"
              label="License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="hospital"
              label="Hospital (Optional)"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Wallet Address"
              value={formData.walletAddress}
              disabled
            />
            <Button
              fullWidth
              variant="contained"
              onClick={connectWallet}
              disabled={loading || !!formData.walletAddress}
              sx={{ mt: 3, mb: 2 }}
            >
              {formData.walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading || !formData.walletAddress || !success}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component="button" onClick={() => navigate('/login')}> Already have an account? Login</Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 