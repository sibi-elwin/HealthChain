import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, Calendar, CheckCircle, XCircle, Clock, Stethoscope } from 'lucide-react';

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
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No access requests</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have any pending access requests from doctors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">{request.doctor.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.status === 'PENDING' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : request.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {request.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                  {request.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {request.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                  {request.status}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mb-2 text-sm text-gray-600">
                <Stethoscope className="h-4 w-4" />
                <span>{request.doctor.doctorProfile.specialization}</span>
              </div>
              
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Purpose:</span> {request.reason}
              </p>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {request.status === 'PENDING' && (
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => handleReview(request.id, 'APPROVED')}
                className="btn-primary flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleReview(request.id, 'REJECTED')}
                className="btn-secondary flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}