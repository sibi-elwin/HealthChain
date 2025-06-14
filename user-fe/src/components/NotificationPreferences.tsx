import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { authService } from '../services/authService';

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
        const response = await authService.updateNotificationPreferences(preferences);
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
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

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.enableWhatsAppNotifications}
                onChange={() => handleToggle('enableWhatsAppNotifications')}
                disabled={saving}
              />
            }
            label="WhatsApp Notifications"
          />
        </Box>

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.enableEmailNotifications}
                onChange={() => handleToggle('enableEmailNotifications')}
                disabled={saving}
              />
            }
            label="Email Notifications"
          />
        </Box>

        {saving && (
          <Box display="flex" alignItems="center" mt={2}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Saving preferences...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
} 