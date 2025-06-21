import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { Bell, Mail, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationPreferences {
  enableWhatsAppNotifications: boolean;
  enableEmailNotifications: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enableWhatsAppNotifications: true,
    enableEmailNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await authService.getNotificationPreferences();
        setPreferences(response);
        setError(null);
      } catch (err) {
        setError('Failed to load notification preferences');
        console.error('Error fetching preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = async (type: keyof NotificationPreferences) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedPreferences = {
        ...preferences,
        [type]: !preferences[type],
      };

      await authService.updateNotificationPreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      setSuccess('Notification preferences updated successfully');
    } catch (err) {
      setError('Failed to update notification preferences');
      console.error('Error updating preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Bell className="h-6 w-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
      </div>

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

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">WhatsApp Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('enableWhatsAppNotifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              preferences.enableWhatsAppNotifications ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.enableWhatsAppNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('enableEmailNotifications')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              preferences.enableEmailNotifications ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.enableEmailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {saving && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          <span>Saving preferences...</span>
        </div>
      )}
    </div>
  );
} 