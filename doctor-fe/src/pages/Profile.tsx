import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User, Save } from 'lucide-react';

export default function Profile() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    specialization: '',
    hospital: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      setProfile(response.data.user);
      setFormData({
        specialization: response.data.user.doctorProfile.specialization,
        hospital: response.data.user.doctorProfile.hospital || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch profile');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.updateProfile(formData);
      setSuccess('Profile updated successfully');
      fetchProfile(); // Refresh profile data
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center mt-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <div className="flex items-center space-x-3 mb-6">
          <User className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Doctor Profile</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Name:</strong> {profile.name}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Wallet Address:</strong> {profile.walletAddress}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Professional Information</h2>
          
          <div>
            <label htmlFor="specialization" className="form-label">Specialization *</label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="hospital" className="form-label">Hospital</label>
            <input
              type="text"
              id="hospital"
              name="hospital"
              value={formData.hospital}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{loading ? 'Updating...' : 'Update Profile'}</span>
          </button>
        </form>
      </div>
    </div>
  );
} 