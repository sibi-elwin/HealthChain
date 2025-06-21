import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { secureStorageService } from '../services/secureStorageService';
import { MedicalRecord } from '../types/medical-record';
import Layout from '../components/Layout';
import { useWallet } from '../hooks/useWallet';
import { getDoctorDetails } from '../services/doctorService';
import { Eye, FileText, Calendar, User } from 'lucide-react';

interface DoctorMedicalRecordsProps {
  onLogout: () => void;
}

const API_URL = 'http://localhost:4000/api';

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
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');

  const fetchAccessibleRecords = async () => {
    try {
      if (doctorAddress) {
        const records = await authService.getAccessibleMedicalRecords();
        setAccessibleRecords(records);
        if (records.length > 0 && !selectedPatientWalletAddress) {
          setSelectedPatientWalletAddress(records[0].patient.walletAddress);
        }
      }
    } catch (err: any) {
      console.error('Error fetching medical records:', err);
      setError(err.message || 'Failed to load medical records');
    }
  };

  useEffect(() => {
    const initializeRecords = async () => {
      try {
        setLoading(true);
        setError('');
        await fetchAccessibleRecords();
      } catch (err: any) {
        console.error('Error initializing medical records:', err);
        setError(err.message || 'Failed to load medical records');
      } finally {
        setLoading(false);
      }
    };

    initializeRecords();

    // Set up polling every 30 seconds
    const pollInterval = setInterval(fetchAccessibleRecords, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval);
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
      setShowPasswordDialog(true);
    } catch (err: any) {
      console.error('Error preparing to view record:', err);
      setError(err.message || 'Failed to prepare record for viewing');
      setDecryptedTextContent(null);
      setDecryptedFileUrl(null);
    } finally {
      setDecrypting(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setDecrypting(true);
      setError('');

      if (!viewingRecord) {
        throw new Error('No record selected for viewing');
      }

      // Get doctor's encSalt using the service
      const doctor = await getDoctorDetails(doctorAddress);
      if (!doctor?.encSalt) {
        throw new Error('Doctor encryption salt not found');
      }

      // For doctors, we need to use the encryptedAesKey from the AccessGrant
      if (!viewingRecord.encryptedAesKey) {
        throw new Error('Encrypted AES key not available for this record.');
      }

      const decryptedData = await secureStorageService.decryptMedicalRecord(
        viewingRecord.ipfsHash,
        viewingRecord.encryptedAesKey,
        password,
        doctor.encSalt,
        doctorAddress
      );

      // Handle different file types
      const fileType = viewingRecord.fileType;
      console.log('Detected file type:', fileType);

      if (fileType && fileType.startsWith('text/')) {
        const textDecoder = new TextDecoder();
        const textContent = textDecoder.decode(decryptedData);
        setDecryptedTextContent(textContent);
      } else if (fileType === 'application/pdf') {
        const blob = new Blob([decryptedData], { type: fileType });
        const url = URL.createObjectURL(blob);
        setDecryptedFileUrl(url);
      } else if (fileType && fileType.startsWith('image/')) {
        const blob = new Blob([decryptedData], { type: fileType });
        const url = URL.createObjectURL(blob);
        setDecryptedFileUrl(url);
      } else {
        console.log('File type not supported for preview:', fileType);
        setError(`File type not supported for preview: ${fileType || 'Unknown'}`);
      }

      setShowPasswordDialog(false);
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
    setShowPasswordDialog(false);
    setViewingRecord(null);
    setDecryptedTextContent(null);
    if (decryptedFileUrl) {
      URL.revokeObjectURL(decryptedFileUrl);
      setDecryptedFileUrl(null);
    }
  };

  if (walletLoading || loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Loading medical records...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Medical Records Access</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {accessibleRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No accessible records</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have access to any medical records yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Patient Selection */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Patient</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient) => (
                  <button
                    key={patient.walletAddress}
                    onClick={() => setSelectedPatientWalletAddress(patient.walletAddress)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedPatientWalletAddress === patient.walletAddress
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-primary-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500">
                          {patient.walletAddress.slice(0, 6)}...{patient.walletAddress.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Records List */}
            {selectedPatientRecords.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Records</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Record Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedPatientRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {record.fileType || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewRecord(record)}
                              className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password Dialog */}
        {showPasswordDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Password</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please enter your password to decrypt and view this medical record.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="input-field mb-4"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseViewer}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={decrypting || !password}
                  className="btn-primary"
                >
                  {decrypting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'View Record'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Record Viewer */}
        {viewingRecord && (decryptedTextContent || decryptedFileUrl) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">{viewingRecord.title}</h3>
                <button
                  onClick={handleCloseViewer}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {decryptedTextContent && (
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 bg-gray-50 p-4 rounded">
                    {decryptedTextContent}
                  </pre>
                )}
                {decryptedFileUrl && (
                  <div className="text-center">
                    {viewingRecord.fileType?.startsWith('image/') ? (
                      <img src={decryptedFileUrl} alt="Medical Record" className="max-w-full h-auto" />
                    ) : (
                      <iframe
                        src={decryptedFileUrl}
                        className="w-full h-96"
                        title="Medical Record"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 