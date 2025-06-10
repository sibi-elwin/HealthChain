import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authService } from '../services/authService';

interface AccessRequestFormProps {
  patientAddress: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AccessRequestForm({ patientAddress, onSuccess, onCancel }: AccessRequestFormProps) {
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.createAccessRequest(patientAddress, purpose);
      onSuccess?.();
    } catch (err) {
      setError('Failed to submit access request');
      console.error('Error submitting access request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Request Access to Patient Records
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Patient Address: {patientAddress}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Purpose of Access"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
          sx={{ mb: 3 }}
          placeholder="Please describe why you need access to these medical records..."
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !purpose.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
} 