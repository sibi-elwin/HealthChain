import { useState } from 'react';
import { authService } from '../services/authService';
import { ethers, SigningKey } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { generateAccessKeyPair, encryptPrivateKey } from '../utils/keyUtils';
import { generateSalts } from '../utils/cryptoUtils';
import { Wallet, Shield, UserPlus } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Doctor Registration</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to access medical records
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="form-label">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="form-label">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="specialization" className="form-label">Specialization *</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="licenseNumber" className="form-label">License Number *</label>
              <input
                type="text"
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="hospital" className="form-label">Hospital (Optional)</label>
              <input
                type="text"
                id="hospital"
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="password" className="form-label">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <button
              type="button"
              onClick={connectWallet}
              disabled={loading || success}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : success ? (
                <Shield className="h-5 w-5" />
              ) : (
                <Wallet className="h-5 w-5" />
              )}
              <span>
                {loading ? 'Connecting...' : success ? 'Wallet Connected' : 'Connect Wallet'}
              </span>
            </button>

            <button
              type="submit"
              disabled={loading || !success}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              <span>{loading ? 'Registering...' : 'Register'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Login Here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 