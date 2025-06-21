import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import Layout from '../components/Layout';
import UserMedicalRecords from '../components/UserMedicalRecords';
import { Plus, FileText } from 'lucide-react';

interface MedicalRecordsProps {
  onLogout: () => void;
}

export default function MedicalRecords({ onLogout }: MedicalRecordsProps) {
  const navigate = useNavigate();
  const { address: userAddress, loading } = useWallet();
  const [error, setError] = useState('');

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
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-gray-900 mb-2">Medical Records</h1>
          <p className="text-gray-600">View and manage your medical records securely</p>
        </div>
        <button
          onClick={() => navigate('/upload-medical-record')}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Upload Record</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="card">
        <UserMedicalRecords />
      </div>
    </Layout>
  );
} 