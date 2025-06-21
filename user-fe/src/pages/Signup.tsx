import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { UserCredentials } from '../types/user';
import { useNavigate } from 'react-router-dom';
import { ethers, Signer } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { Wallet, User, Calendar, Shield, CheckCircle } from 'lucide-react';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCredentials>({
    name: '',     
    email: '',        
    walletAddress: '',
    phoneNumber: '',
    password: '',
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
          !formData.gender || !formData.walletAddress || !formData.password) {
        const missingFields = [];
        if (!formData.name) missingFields.push('Name');
        if (!formData.email) missingFields.push('Email');
        if (!formData.dob) missingFields.push('Date of Birth');
        if (!formData.gender) missingFields.push('Gender');
        if (!formData.walletAddress) missingFields.push('Wallet Address');
        if (!formData.password) missingFields.push('Password');
        
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join HealthChain to securely manage your medical records
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-600 text-sm">Wallet connected successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Emergency Contact</label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="form-label">Allergies</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="input-field"
                  rows={3}
                  placeholder="List any allergies or medical conditions..."
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-primary-600" />
                Wallet Connection
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="form-label">Wallet Address</label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Connect your wallet to auto-fill"
                    readOnly
                  />
                </div>

                {!formData.walletAddress && (
                  <button
                    type="button"
                    onClick={connectWallet}
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}
                    <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors"
              >
                Already have an account? Login
              </button>

              <button
                type="submit"
                disabled={loading || !formData.walletAddress}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup; 