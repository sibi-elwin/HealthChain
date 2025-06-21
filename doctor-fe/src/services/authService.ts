import axios, { AxiosError } from 'axios';
import { ethers, BrowserProvider } from 'ethers';

const API_URL = 'http://localhost:4000/api/doctor';

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
    if (error.response?.status === 401) {
      // Clear token on authentication error
      localStorage.removeItem('token');
    }
    return Promise.reject(new Error(errorMessage));
  }
);

interface AccessRequest {
  id: string;
  doctorId: string;
  patientId: string;
  doctorWalletAddress: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reviewedAt?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationPreferences {
  enableWhatsAppNotifications: boolean;
  enableEmailNotifications: boolean;
}

export const authService = {
  async requestNonce(address: string, purpose: 'wallet_connection' | 'registration' | 'login' = 'wallet_connection'): Promise<string> {
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

  async validateToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await api.get('/validate-token');
      
      // For wallet connection tokens, we just need to check if verified is true
      if (response.data.data?.verified) {
        return true;
      }
      
      // For regular tokens, we need a user object
      return !!response.data.data?.user;
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token'); // Clear invalid token
      return false;
    }
  },

  async verifySignature(address: string, signature: string, purpose: 'wallet_connection' | 'registration' | 'login' = 'wallet_connection'): Promise<{ token: string; verified: boolean }> {
    try {
      console.log('Verifying signature for address:', address);
      console.log('Signature to verify:', signature);
      console.log('Purpose:', purpose);
      
      const response = await api.post('/verify', { address, signature, purpose });
      console.log('Verification response:', response.data);
      
      // For wallet_connection, we don't need to store the token
      if (purpose === 'wallet_connection') {
        const verified = response.data.data?.verified || false;
        return { token: '', verified };
      }
      
      // For other purposes, we need the token
      const token = response.data.data?.token || response.data.token;
      if (!token) {
        console.error('Invalid response format:', response.data);
        throw new Error('No token received');
      }
      
      console.log('Token received:', token);
      localStorage.setItem('token', token);
      return { token, verified: true };
    } catch (error: any) {
      console.error('Signature verification error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw new Error(error.response?.data?.error || error.message || 'Failed to verify signature');
    }
  },

  async register(doctorData: {
    name: string;
    email: string;
    walletAddress: string;
    specialization: string;
    licenseNumber: string;
    hospital?: string;
    signature: string;
    password: string;
    publicKey: string;
    pairPublicKey: string;
    encryptedPrivateKey: string;
    authSalt: string;
    encSalt: string;
  }): Promise<{ doctor: any }> {
    try {
      console.log('Registering doctor with data:', {
        ...doctorData,
        signature: doctorData.signature ? `present (length: ${doctorData.signature.length})` : 'missing',
        walletAddress: doctorData.walletAddress ? `present (length: ${doctorData.walletAddress.length})` : 'missing',
        password: doctorData.password ? 'present' : 'missing',
        publicKey: doctorData.publicKey ? 'present' : 'missing',
        pairPublicKey: doctorData.pairPublicKey ? 'present' : 'missing',
        encryptedPrivateKey: doctorData.encryptedPrivateKey ? 'present' : 'missing',
        authSalt: doctorData.authSalt ? 'present' : 'missing',
        encSalt: doctorData.encSalt ? 'present' : 'missing'
      });

      // Validate the data before sending
      const requiredFields = [
        'name', 'email', 'specialization', 'licenseNumber',
        'walletAddress', 'signature', 'password', 'publicKey', 
        'pairPublicKey', 'encryptedPrivateKey', 'authSalt', 'encSalt'
      ];

      const missingFields = requiredFields.filter(field => !doctorData[field as keyof typeof doctorData]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await api.post('/register', doctorData);
      console.log('Registration response:', response.data);
      
      if (!response.data.data?.user) {
        console.error('Invalid response format:', response.data);
        throw new Error('Registration failed - invalid response');
      }
      
      const { user } = response.data.data;
      return { doctor: user };
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  },

  async getProfile() {
    try {
      const token = localStorage.getItem('token');
      console.log('Token before profile request:', token);
      const response = await api.get('/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to get profile');
    }
  },

  async updateProfile(data: {
    specialization?: string;
    hospital?: string;
  }) {
    try {
      const response = await api.put('/profile', data);
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to update profile');
    }
  },

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to use this feature');
    }

    try {
      console.log('Requesting wallet connection...');
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
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
      // Assuming the wallet address is stored in the 'address' field of the JWT payload
      return { walletAddress: decodedPayload.address };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  async verifyDoctorRole(walletAddress: string): Promise<boolean> {
    try {
      const response = await api.get(`/verify/${walletAddress}`);
      return response.data.data.blockchain.roles.doctor;
    } catch (error: any) {
      console.error('Error verifying doctor role:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to verify doctor role');
    }
  },

  async getAccessibleMedicalRecords(): Promise<any> {
    try {
      const response = await api.get('/accessible-medical-records');
      return response.data.data.records;
    } catch (error: any) {
      console.error('Error fetching accessible medical records:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch accessible medical records');
    }
  },

  async createAccessRequest(patientWalletAddress: string, reason: string): Promise<AccessRequest> {
    try {
      const response = await api.post('/access-request', { patientWalletAddress, reason });
      return response.data.data.accessRequest;
    } catch (error: any) {
      console.error('Error creating access request:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to create access request');
    }
  },

  async getAccessRequests(): Promise<AccessRequest[]> {
    try {
      const response = await api.get('/access-requests');
      return response.data.data.accessRequests;
    } catch (error: any) {
      console.error('Error fetching access requests:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch access requests');
    }
  },

  async getNotifications(): Promise<NotificationsResponse> {
    try {
      const user = this.getUserFromToken();
      if (!user?.walletAddress) {
        throw new Error('User wallet address not found');
      }
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_URL}/${user.walletAddress}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  },

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const user = this.getUserFromToken();
      if (!user?.walletAddress) {
        throw new Error('User wallet address not found');
      }
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(
        `${API_URL}/${user.walletAddress}/notification-preferences`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.message) {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(error.message || 'Failed to update notification preferences');
    }
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const user = this.getUserFromToken();
      if (!user?.walletAddress) {
        throw new Error('User wallet address not found');
      }
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${API_URL}/${user.walletAddress}/notification-preferences`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  },

  async getDoctorDashboardStats(doctorAddress: string): Promise<{
    totalRecordsAccessible: number;
    pendingAccessRequests: number;
    unreadNotifications: number;
  }> {
    try {
      const response = await api.get(`/dashboard/stats/${doctorAddress}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching doctor dashboard stats:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch dashboard stats');
    }
  },

  async requestAccessToMedicalRecords(patientAddress: string, doctorAddress: string): Promise<any> {
    try {
      const response = await api.post('/access-requests', {
        patientWalletAddress: patientAddress,
        doctorWalletAddress: doctorAddress,
        // Add any other necessary fields for the access request if your backend requires them
        reason: "Medical consultation request", // Placeholder reason
      });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting access to medical records:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to request access');
    }
  },
}; 