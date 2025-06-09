import { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { authService } from '../services/authService';

interface AccessRequest {
  id: string;
  doctorName: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function AccessRequestList() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await authService.getAccessRequests();
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (loading) return <CircularProgress />;
  if (!requests.length) return <Typography>No access requests</Typography>;

  return (
    <Box>
      {requests.map((request) => (
        <Box key={request.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd' }}>
          <Typography>{request.doctorName}</Typography>
          <Typography>Purpose: {request.purpose}</Typography>
          {request.status === 'PENDING' && (
            <Box sx={{ mt: 1 }}>
              <Button onClick={() => authService.reviewAccessRequest(request.id, 'APPROVED')}>Approve</Button>
              <Button onClick={() => authService.reviewAccessRequest(request.id, 'REJECTED')}>Reject</Button>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
}