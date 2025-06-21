import { useState, useEffect } from 'react';
import { secureStorageService, MedicalRecord } from '../services/secureStorageService';
import { useWallet } from '../hooks/useWallet';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  UserPlus, 
  UserMinus, 
  FileText, 
  Calendar, 
  Download,
  X,
  Lock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

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
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showGrantAccessPasswordDialog, setShowGrantAccessPasswordDialog] = useState(false);

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

      // Get user's encSalt from backend
      const userResponse = await fetch(`http://localhost:4000/api/user/${userAddress}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { data: { user } } = await userResponse.json();
      if (!user.encSalt) {
        throw new Error('User encryption salt not found');
      }

      if (!viewingRecord.encryptedAesKeyForPatient) {
        throw new Error('Encrypted AES key not available for this record.');
      }

      const decryptedData = await secureStorageService.decryptMedicalRecord(
        viewingRecord.ipfsHash,
        viewingRecord.encryptedAesKeyForPatient,
        password,
        user.encSalt
      );

      const fileType = viewingRecord.fileType;
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
      if (!selectedRecord.encryptedAesKeyForPatient) {
        throw new Error('Encrypted AES key not found for this record.');
      }
      setShowGrantAccessPasswordDialog(true);
    } catch (err: any) {
      console.error('Error preparing to grant access:', err);
      setError(err.message || 'Failed to prepare access grant');
    }
  };

  const handleGrantAccessPasswordSubmit = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (!selectedRecord || !doctorAddress) {
        throw new Error('Record or doctor address not selected');
      }

      // Get user's encSalt from backend
      const userResponse = await fetch(`http://localhost:4000/api/user/${userAddress}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { data: { user } } = await userResponse.json();
      if (!user.encSalt) {
        throw new Error('User encryption salt not found');
      }

      await secureStorageService.grantAccess(
        selectedRecord.id,
        userAddress,
        doctorAddress,
        selectedRecord.encryptedAesKeyForPatient || '',
        password
      );

      setSuccess('Access granted successfully');
      setGrantAccessDialog(false);
      setShowGrantAccessPasswordDialog(false);
      setDoctorAddress('');
      setPassword('');
      fetchRecords(); // Refresh the records
    } catch (err: any) {
      console.error('Error granting access:', err);
      setError(err.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (record: MedicalRecord, doctorAddress: string) => {
    try {
      setLoading(true);
      setError('');

      await secureStorageService.revokeAccess(record.id, userAddress, doctorAddress);
      setSuccess('Access revoked successfully');
      fetchRecords(); // Refresh the records
    } catch (err: any) {
      console.error('Error revoking access:', err);
      setError(err.message || 'Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading medical records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {records.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading your first medical record.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/upload-medical-record')}
              className="btn-primary"
            >
              Upload Record
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Grants
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.title}
                        </div>
                        {record.description && (
                          <div className="text-sm text-gray-500">
                            {record.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.fileType || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.accessGrants?.length || 0} doctors
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setGrantAccessDialog(true);
                          }}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Grant Access
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grant Access Dialog */}
      {grantAccessDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Grant Access to Doctor</h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Doctor's Wallet Address</label>
                  <input
                    type="text"
                    value={doctorAddress}
                    onChange={(e) => setDoctorAddress(e.target.value)}
                    className="input-field"
                    placeholder="Enter doctor's wallet address"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setGrantAccessDialog(false);
                      setDoctorAddress('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGrantAccess}
                    disabled={!doctorAddress}
                    className="btn-primary flex-1"
                  >
                    Grant Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Dialog for Grant Access */}
      {showGrantAccessPasswordDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary-600" />
                Enter Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Your Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowGrantAccessPasswordDialog(false);
                      setPassword('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGrantAccessPasswordSubmit}
                    disabled={!password || loading}
                    className="btn-primary flex-1 flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Grant Access'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Dialog for Viewing */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary-600" />
                Enter Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Your Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setPassword('');
                      handleCloseViewer();
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={!password || decrypting}
                    className="btn-primary flex-1 flex items-center justify-center"
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
          </div>
        </div>
      )}

      {/* Record Viewer */}
      {viewerOpen && (decryptedTextContent || decryptedFileUrl) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {viewingRecord?.title}
              </h3>
              <button
                onClick={handleCloseViewer}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-auto">
              {decryptedTextContent && (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {decryptedTextContent}
                </pre>
              )}
              
              {decryptedFileUrl && (
                <div className="text-center">
                  {viewingRecord?.fileType?.startsWith('image/') ? (
                    <img
                      src={decryptedFileUrl}
                      alt={viewingRecord.title}
                      className="max-w-full max-h-80 object-contain"
                    />
                  ) : (
                    <iframe
                      src={decryptedFileUrl}
                      className="w-full h-96"
                      title={viewingRecord?.title}
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCloseViewer}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 