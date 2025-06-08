import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';
import { UserCredentials, UserData } from '../types/user';

const API_URL = 'http://localhost:4000/api/user';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string }>) => {
    const errorMessage = error.response?.data?.error || error.message;
    console.error('API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

export const authService = {
  async requestNonce(address: string, purpose: 'wallet_connection' | 'registration' = 'wallet_connection'): Promise<string> {
    try {
      console.log('Requesting nonce for address:', address, 'with purpose:', purpose);
      const response = await api.post('/nonce', { address, purpose });
      console.log('Nonce response:', response.data);
      
      // Handle both response formats
      const nonce = response.data.data?.nonce || response.data.nonce;
      
      if (!nonce) {
        console.error('Invalid response format:', response.data);
        throw new Error('No nonce received from server');
      }
      
      console.log('Extracted nonce:', nonce, 'for purpose:', purpose);
      return nonce;
    } catch (error: any) {
      console.error('Nonce request error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw new Error(error.response?.data?.error || error.message || 'Failed to request nonce');
    }
  },

  async verifySignature(address: string, signature: string, purpose: 'wallet_connection' | 'registration' = 'wallet_connection'): Promise<string> {
    try {
      console.log('Verifying signature for address:', address);
      const response = await api.post('/verify', { address, signature, purpose });
      console.log('Verification response:', response.data);
      
      // Handle both response formats
      const token = response.data.data?.token || response.data.token;
      
      if (!token) {
        console.error('Invalid response format:', response.data);
        throw new Error('No token received');
      }
      
      console.log('Token received:', token);
      localStorage.setItem('token', token);
      return token;
    } catch (error: any) {
      console.error('Signature verification error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw new Error(error.response?.data?.error || error.message || 'Failed to verify signature');
    }
  },

  async register(userData: UserCredentials): Promise<UserData> {
    try {
      console.log('Registering user with data:', {
        ...userData,
        signature: userData.signature ? `present (length: ${userData.signature.length})` : 'missing',
        walletAddress: userData.walletAddress ? `present (length: ${userData.walletAddress.length})` : 'missing'
      });

      // Validate the data before sending
      const requiredFields = [
        'name', 'email', 'dob', 'gender',
        'walletAddress', 'signature'
      ];

      const missingFields = requiredFields.filter(field => !userData[field as keyof UserCredentials]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await api.post('/register', userData);
      console.log('Registration response:', response.data);
      
      if (!response.data.data?.user || !response.data.data?.token) {
        console.error('Invalid response format:', response.data);
        throw new Error('Registration failed - invalid response');
      }
      
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  },

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to use this feature');
    }

    try {
      console.log('Requesting wallet connection...');
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('Wallet connected successfully:', address);
      return { address, signer };
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      throw new Error(error.message || 'Failed to connect wallet');
    }
  },

  async signMessage(signer: ethers.Signer, message: string): Promise<string> {
    try {
      console.log('Requesting signature for message:', message);
      const signature = await signer.signMessage(message);
      console.log('Signature generated:', signature);
      return signature;
    } catch (error: any) {
      console.error('Message signing error:', error);
      throw new Error(error.message || 'Failed to sign message');
    }
  },

  async login(): Promise<string> {
    try {
      // 1. Connect wallet
      const { address, signer } = await this.connectWallet();
      
      // 2. Request nonce
      const nonce = await this.requestNonce(address);
      
      // 3. Create message to sign
      const message = `Sign this message to authenticate with HealthChain. Nonce: ${nonce}`;
      
      // 4. Sign message
      const signature = await this.signMessage(signer, message);
      
      // 5. Verify signature and get token
      const token = await this.verifySignature(address, signature);
      
      return token;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message.includes('User denied')) {
        throw new Error('Please approve the signature request in MetaMask');
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  logout() {
    localStorage.removeItem('token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUserFromToken(): { walletAddress: string } | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      return { walletAddress: decodedPayload.address };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}; 