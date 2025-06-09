import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { authService } from '../services/authService';

interface DoctorProfile {
  specialization: string;
  licenseNumber: string;
}

interface Doctor {
  id: string;
  name: string;
  doctorProfile: DoctorProfile;
}

interface AccessRequest {
  id: string;
  doctor: Doctor;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
}

export function AccessRequestList() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const data = await authService.getAccessRequests();
      console.log('Received access requests:', data);
      setRequests(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to load access requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await authService.reviewAccessRequest(requestId, status);
      // Refresh the list after review
      fetchRequests();
    } catch (err) {
      console.error('Failed to review request:', err);
      setError('Failed to review request');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>No access requests</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {requests.map((request) => (
        <Box key={request.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <Typography variant="h6">{request.doctor.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {request.doctor.doctorProfile.specialization}
          </Typography>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Purpose: {request.reason}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Requested: {new Date(request.requestedAt).toLocaleDateString()}
          </Typography>
          {request.status === 'PENDING' && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => handleReview(request.id, 'APPROVED')}
              >
                Approve
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => handleReview(request.id, 'REJECTED')}
              >
                Reject
              </Button>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}