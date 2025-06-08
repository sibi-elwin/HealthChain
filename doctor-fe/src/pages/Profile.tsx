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
} from '@mui/material';
import { authService } from '../services/authService';

export default function Profile() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    specialization: '',
    hospital: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      setProfile(response.data.user);
      setFormData({
        specialization: response.data.user.doctorProfile.specialization,
        hospital: response.data.user.doctorProfile.hospital || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.updateProfile(formData);
      setSuccess('Profile updated successfully');
      fetchProfile(); // Refresh profile data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Doctor Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Typography>
            <strong>Name:</strong> {profile.name}
          </Typography>
          <Typography>
            <strong>Email:</strong> {profile.email}
          </Typography>
          <Typography>
            <strong>Wallet Address:</strong> {profile.walletAddress}
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Professional Information
          </Typography>
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
            fullWidth
            id="hospital"
            label="Hospital"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 