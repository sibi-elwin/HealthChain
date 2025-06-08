import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { secureStorageService, MedicalRecord } from '../services/secureStorageService';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';

export default function UserMedicalRecords() {
  const navigate = useNavigate();
  const { address: userAddress } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [grantAccessDialog, setGrantAccessDialog] = useState(false);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [decryptedTextContent, setDecryptedTextContent] = useState<string | null>(null);
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (userAddress) {
      fetchRecords();
    }
  }, [userAddress]);

  const fetchRecords = async () => {
    try {
      const fetchedRecords = await secureStorageService.getMedicalRecords(userAddress);
      console.log('Fetched medical records with grants:', fetchedRecords);
      setRecords(fetchedRecords || []); // Ensure we always have an array
    } catch (err: any) {
      console.error('Error fetching medical records:', err);
      setError(err.message || 'Failed to fetch records');
      setRecords([]); // Set empty array on error
    }
  };

  const handleViewRecord = async (record: MedicalRecord) => {
    try {
      console.log('Attempting to view record:', record);
      setViewingRecord(record);
      setDecryptedTextContent(null);
      setDecryptedFileUrl(null);
      setDecrypting(true);
      setError('');
      setViewerOpen(true);

      const rawAesKey = record.aesKey;
      console.log('Raw AES key for decryption:', rawAesKey);
      if (!rawAesKey) {
        throw new Error('Raw AES key not available for this record.');
      }

      const decryptedData = await secureStorageService.decryptMedicalRecord(
        record.ipfsHash,
        rawAesKey
      );

      const fileType = record.fileType;
      console.log('Detected file type:', fileType);

      if (fileType && fileType.startsWith('text/')) {
        // Handle text files
        try {
          const textDecoder = new TextDecoder();
          const textContent = textDecoder.decode(decryptedData);
          setDecryptedTextContent(textContent);
          console.log('Decrypted as text.');
        } catch (decodeError) {
          console.error('Error decoding text:', decodeError);
          setError('Failed to decode text content.');
        }
      } else if (fileType === 'application/pdf') {
        // Handle PDF files
        try {
          const blob = new Blob([decryptedData], { type: fileType });
          const url = URL.createObjectURL(blob);
          setDecryptedFileUrl(url);
          console.log('Decrypted as PDF, created Blob URL:', url);
        } catch (blobError) {
          console.error('Error creating PDF blob:', blobError);
          setError('Failed to prepare PDF for viewing.');
        }
      } else if (fileType && fileType.startsWith('image/')) {
        // Handle image files
        try {
          const blob = new Blob([decryptedData], { type: fileType });
          const url = URL.createObjectURL(blob);
          setDecryptedFileUrl(url);
          console.log('Decrypted as image, created Blob URL:', url);
        } catch (blobError) {
          console.error('Error creating image blob:', blobError);
          setError('Failed to prepare image for viewing.');
        }
      } else {
        // Handle unsupported file types for preview
        console.log('File type not supported for preview:', fileType);
        setError(`File type not supported for preview: ${fileType || 'Unknown'}`);
      }

    } catch (err: any) {
      console.error('Error viewing record:', err);
      setError(err.message || 'Failed to view record');
      setDecryptedTextContent(null);
      setDecryptedFileUrl(null);
    } finally {
      setDecrypting(false);
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setViewingRecord(null);
    setDecryptedTextContent(null);
    if (decryptedFileUrl) {
      URL.revokeObjectURL(decryptedFileUrl);
      setDecryptedFileUrl(null);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedRecord || !doctorAddress) return;

    try {
      if (!selectedRecord.aesKey) {
        throw new Error('AES key not found for this record.');
      }
      await secureStorageService.grantAccess(selectedRecord.id, userAddress, doctorAddress, selectedRecord.aesKey);
      setSuccess('Access granted successfully');
      setGrantAccessDialog(false);
      setDoctorAddress('');
      fetchRecords(); // Refresh records to update access list
    } catch (err: any) {
      setError(err.message || 'Failed to grant access');
    }
  };

  const handleRevokeAccess = async (record: MedicalRecord, doctorAddress: string) => {
    try {
      await secureStorageService.revokeAccess(record.id, userAddress, doctorAddress);
      setSuccess('Access revoked successfully');
      fetchRecords(); // Refresh records to update access list
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access');
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading records...</Typography>
      </Box>
    );
  }

  if (records.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No medical records found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload your first medical record to get started
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/medical-records/upload')}
        >
          Upload Record
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          My Medical Records
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

        {records.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Uploaded Records
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>File Type</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.title}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.fileType}</TableCell>
                      <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewRecord(record)} color="primary">
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedRecord(record);
                            setGrantAccessDialog(true);
                          }}
                          color="primary"
                        >
                          <PersonAddIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      <Dialog open={grantAccessDialog} onClose={() => setGrantAccessDialog(false)}>
        <DialogTitle>Grant Access to Record: {selectedRecord?.title}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Doctor Wallet Address"
            type="text"
            fullWidth
            variant="standard"
            value={doctorAddress}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDoctorAddress(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGrantAccessDialog(false)}>Cancel</Button>
          <Button onClick={handleGrantAccess}>Grant Access</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewerOpen}
        onClose={handleCloseViewer}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {viewingRecord?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2, mb: 2 }}>
            {decrypting ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : decryptedTextContent !== null ? (
              <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {decryptedTextContent}
              </Typography>
            ) : decryptedFileUrl !== null && viewingRecord?.fileType === 'application/pdf' ? (
              <Box sx={{ width: '100%', height: '500px' }}>
                <iframe
                  src={decryptedFileUrl}
                  title="Medical Record Viewer"
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </Box>
            ) : decryptedFileUrl !== null && viewingRecord?.fileType?.startsWith('image/') ? (
              <Box sx={{ maxWidth: '100%', maxHeight: '500px' }}>
                <img
                  src={decryptedFileUrl}
                  alt="Medical Record Image"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <Typography>
                Cannot preview this file type ({viewingRecord?.fileType || 'Unknown'}).
              </Typography>
            )}
          </Box>
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            {decryptedFileUrl && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => window.open(decryptedFileUrl!, '_blank')}
                sx={{ mr: 1 }}
              >
                Open in New Tab
              </Button>
            )}
            <Button variant="outlined" onClick={handleCloseViewer}>
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
} 