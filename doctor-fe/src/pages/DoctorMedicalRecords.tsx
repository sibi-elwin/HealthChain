import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { authService } from '../services/authService';
import { secureStorageService } from '../services/secureStorageService';
import { MedicalRecord } from '../types/medical-record';
import Layout from '../components/Layout';
import { useWallet } from '../hooks/useWallet';

interface DoctorMedicalRecordsProps {
  onLogout: () => void;
}

export default function DoctorMedicalRecords({ onLogout }: DoctorMedicalRecordsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { address: doctorAddress, loading: walletLoading } = useWallet();
  const [accessibleRecords, setAccessibleRecords] = useState<MedicalRecord[]>([]);
  const [selectedPatientWalletAddress, setSelectedPatientWalletAddress] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [decryptedTextContent, setDecryptedTextContent] = useState<string | null>(null);
  const [decryptedFileUrl, setDecryptedFileUrl] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    const initializeRecords = async () => {
      try {
        setLoading(true);
        setError('');
        if (doctorAddress) {
          const records = await authService.getAccessibleMedicalRecords();
          setAccessibleRecords(records);
          if (records.length > 0) {
            setSelectedPatientWalletAddress(records[0].patient.walletAddress);
          }
        } else if (!walletLoading) {
          setError('Doctor wallet address not found or wallet not connected.');
        }
      } catch (err: any) {
        console.error('Error initializing medical records:', err);
        setError(err.message || 'Failed to load medical records');
      } finally {
        setLoading(false);
      }
    };

    initializeRecords();
  }, [doctorAddress, walletLoading]);

  const recordsByPatient = accessibleRecords.reduce((acc: Record<string, MedicalRecord[]>, record) => {
    const patientAddress = record.patient.walletAddress;
    if (!acc[patientAddress]) {
      acc[patientAddress] = [];
    }
    acc[patientAddress].push(record);
    return acc;
  }, {} as Record<string, MedicalRecord[]>);

  const selectedPatientRecords = selectedPatientWalletAddress
    ? recordsByPatient[selectedPatientWalletAddress] || []
    : [];

  const patients = (Object.values(recordsByPatient) as MedicalRecord[][]).map((records: MedicalRecord[]) => records[0].patient);

  const handleViewRecord = async (record: MedicalRecord) => {
    try {
      console.log('Attempting to view record:', record);
      setViewingRecord(record);
      setDecryptedTextContent(null);
      setDecryptedFileUrl(null);
      setDecrypting(true);
      setError('');

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
    if (decryptedFileUrl) {
      URL.revokeObjectURL(decryptedFileUrl);
      console.log('Revoked Blob URL:', decryptedFileUrl);
    }
    setViewingRecord(null);
    setDecryptedTextContent(null);
    setDecryptedFileUrl(null);
    setError('');
  };

  if (walletLoading || loading) {
    return (
      <Layout onLogout={onLogout}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading records...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!doctorAddress) {
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

  if (error) {
    return (
      <Layout onLogout={onLogout}>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Accessible Medical Records
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" mb={2}>
          <Typography variant="h6" sx={{ mr: 2 }}>Patients:</Typography>
          {patients.length > 0 ? (
            <List dense sx={{ display: 'flex', flexDirection: 'row', p: 0 }}>
              {patients.map((patient: any) => (
                <ListItem
                  button
                  key={patient.walletAddress}
                  selected={selectedPatientWalletAddress === patient.walletAddress}
                  onClick={() => setSelectedPatientWalletAddress(patient.walletAddress)}
                  sx={{ width: 'auto', pr: 2 }}
                >
                  <ListItemText primary={patient.name} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary">No patients with accessible records.</Typography>
          )}
        </Box>

        {selectedPatientWalletAddress && selectedPatientRecords.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Records for {patients.find(p => p.walletAddress === selectedPatientWalletAddress)?.name || 'Selected Patient'}
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
                  {selectedPatientRecords.map((record: MedicalRecord) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.title}</TableCell>
                      <TableCell>{record.description}</TableCell>
                      <TableCell>{record.fileType}</TableCell>
                      <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleViewRecord(record)} color="primary">
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {!selectedPatientWalletAddress && accessibleRecords.length > 0 && (
            <Typography variant="body1" color="text.secondary">
              Please select a patient to view their medical records.
            </Typography>
        )}

        {accessibleRecords.length === 0 && !loading && !doctorAddress && (
          <Typography variant="body1" color="text.secondary">
            You do not currently have access to any medical records.
          </Typography>
        )}
      </Paper>

      <Dialog
        open={!!viewingRecord}
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
                onClick={() => window.open(decryptedFileUrl!, ' _blank')}
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
    </Layout>
  );
} 