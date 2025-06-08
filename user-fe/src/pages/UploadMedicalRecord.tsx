import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import { secureStorageService } from '../services/secureStorageService';

interface UploadMedicalRecordProps {
  onLogout: () => void;
}

export default function UploadMedicalRecord({ onLogout }: UploadMedicalRecordProps) {
  const navigate = useNavigate();
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadData({
        ...uploadData,
        file: event.target.files[0],
      });
    }
  };

  const handleUpload = async () => {
    if (!userAddress || !uploadData.file) return;

    try {
      setUploading(true);
      setError('');

      // Upload medical record using the secure storage service
      await secureStorageService.uploadMedicalRecord(
        uploadData.file,
        userAddress,
        uploadData.description
      );

      // Navigate back to medical records page after successful upload
      navigate('/medical-records');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload medical record');
    } finally {
      setUploading(false);
    }
  };

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Medical Record
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload your medical records securely. All files are encrypted and stored on the blockchain.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box component="form" noValidate autoComplete="off">
          <TextField
            fullWidth
            label="Title"
            value={uploadData.title}
            onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
            margin="normal"
            required
            disabled={uploading}
          />
          <TextField
            fullWidth
            label="Description"
            value={uploadData.description}
            onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            disabled={uploading}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mt: 2 }}
            disabled={uploading}
          >
            Choose File
            <input
              type="file"
              hidden
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Button>
          {uploadData.file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {uploadData.file.name}
            </Typography>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/medical-records')}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!uploadData.file || !uploadData.title || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : null}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Layout>
  );
} 