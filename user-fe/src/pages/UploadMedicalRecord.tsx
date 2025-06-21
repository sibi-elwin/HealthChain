import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import { secureStorageService } from '../services/secureStorageService';
import { Upload, FileText, Lock, Shield } from 'lucide-react';

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
    password: '',
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
        uploadData.description,
        uploadData.password
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
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading wallet connection...</p>
        </div>
      </Layout>
    );
  }

  if (!userAddress) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Wallet Connection Required
            </h2>
            <p className="text-gray-600">
              Please connect your wallet to manage medical records
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="mb-8">
        <h1 className="heading-2 text-gray-900 mb-2">Upload Medical Record</h1>
        <p className="text-gray-600">
          Upload your medical records securely. All files are encrypted and stored on the blockchain.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="card">
        <form className="space-y-6">
          <div>
            <label className="form-label">Title *</label>
            <input
              type="text"
              value={uploadData.title}
              onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
              className="input-field"
              placeholder="Enter record title"
              required
              disabled={uploading}
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
              className="input-field"
              rows={4}
              placeholder="Enter record description (optional)"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="form-label">Password *</label>
            <input
              type="password"
              value={uploadData.password}
              onChange={(e) => setUploadData({ ...uploadData, password: e.target.value })}
              className="input-field"
              placeholder="Enter encryption password"
              required
              disabled={uploading}
            />
            <p className="text-sm text-gray-500 mt-1">
              This password will be used to encrypt your medical record. Please remember it as you'll need it to access the record later.
            </p>
          </div>

          <div>
            <label className="form-label">Medical Record File *</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, Images, or any medical document
                </p>
              </div>
            </div>
            {uploadData.file && (
              <div className="mt-2 flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-2" />
                <span>{uploadData.file.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => navigate('/medical-records')}
              disabled={uploading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!uploadData.file || !uploadData.title || !uploadData.password || uploading}
              className="btn-primary flex items-center space-x-2"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Shield className="h-5 w-5" />
              )}
              <span>{uploading ? 'Uploading...' : 'Upload Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 