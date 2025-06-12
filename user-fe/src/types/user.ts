export interface UserCredentials {
  name: string;
  email: string;
  walletAddress: string;
  signature?: string;
  phoneNumber?: string;
  password: string;
  // Patient specific fields
  dob: string;
  gender: string;
  allergies?: string;
  bloodGroup?: string;
  emergencyContact?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  walletAddress: string;
  phoneNumber?: string;
  authSalt: string;
  encSalt: string;
  createdAt: string;
  updatedAt: string;
  patientProfile?: {
    dob: string;
    gender: string;
    allergies?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  walletAddress: string | null;
  loading: boolean;
  error: string | null;
} 