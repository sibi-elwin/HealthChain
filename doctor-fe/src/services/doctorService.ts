import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDoctorDetails = async (walletAddress: string): Promise<any> => {
  try {
    const response = await api.get(`/doctor/details/${walletAddress}`);
    if (!response.data || !response.data.data || !response.data.data.user) {
      throw new Error('Invalid doctor data received from server');
    }
    return response.data.data.user;
  } catch (error: any) {
    console.error('Error getting doctor details:', error);
    if (error.response?.status === 404) {
      throw new Error('Doctor not found');
    }
    throw new Error(error.response?.data?.error || 'Failed to get doctor details');
  }
}; 