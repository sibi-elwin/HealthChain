import { useState } from 'react';
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
import { ethers, SigningKey } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { generateAccessKeyPair, encryptPrivateKey } from '../utils/keyUtils';
import { generateSalts } from '../utils/cryptoUtils';

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
    password: '',
  });

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
      setLoading(true);
      setError('');
      

    try {
      if (!formData.name || !formData.email || !formData.specialization || !formData.licenseNumber || !formData.password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!success) {
        throw new Error('Please connect your wallet first');
      }

      // Generate salts for password hashing and private key encryption
      const { authSalt, encSalt } = generateSalts();

      // Generate access key pair for record access
      const { pairPublicKey, privateKey } = await generateAccessKeyPair();

      // Encrypt the private key with the password and enc salt
      const encryptedPrivateKey = await encryptPrivateKey(privateKey, formData.password, encSalt);

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
        nonce: registrationNonce,
        pairPublicKey,
        encryptedPrivateKey,
        authSalt,
        encSalt
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
        nonce: registrationNonce,
        pairPublicKey,
        encryptedPrivateKey: 'present',
        authSalt: 'present',
        encSalt: 'present'
      });

      // Register doctor with backend
      const { doctor } = await authService.register(registrationData);
      
      console.log('Registration successful:', doctor);

      // Get a fresh nonce for login
      console.log('Getting fresh nonce for login...');
      const loginNonce = await authService.requestNonce(formData.walletAddress, 'login');
      console.log('Received login nonce:', loginNonce);

      // Sign the login nonce
      console.log('Signing login nonce...');
      const loginSignature = await authService.signMessage(signer, loginNonce);
      console.log('Generated login signature:', loginSignature);

      // Get a new token for the registered user
      console.log('Getting new token for registered user...');
      const { token: newToken, verified: tokenVerified } = await authService.verifySignature(formData.walletAddress, loginSignature, 'login');
      if (!tokenVerified || !newToken) {
        throw new Error('Failed to get authentication token after registration');
      }
      console.log('New token received after registration');

      // Navigate to dashboard after successful registration and token verification
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

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

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              label="Hospital (Optional)"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={connectWallet}
              disabled={loading || success}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : success ? 'Wallet Connected' : 'Connect Wallet'}
            </Button>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !success}
              sx={{ mt: 2, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component="button" onClick={() => navigate('/login')}>
                  Login Here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 