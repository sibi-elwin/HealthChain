import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import UserMedicalRecords from '../components/UserMedicalRecords';

interface MedicalRecordsProps {
  onLogout: () => void;
}

export default function MedicalRecords({ onLogout }: MedicalRecordsProps) {
  const navigate = useNavigate();
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading wallet connection...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!userAddress) {
    return (
      <Layout onLogout={onLogout}>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Please connect your wallet to manage medical records
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Medical Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/medical-records/upload')}
        >
          Upload Record
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <UserMedicalRecords />
      </Paper>
    </Layout>
  );
} 