import Layout from '../components/Layout';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  onLogout: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  return (
    <Layout onLogout={onLogout}>
      <div className="mb-8">
        <h1 className="heading-2 text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and notifications</p>
      </div>

      <div className="card">
        <NotificationPreferences />
      </div>
    </Layout>
  );
} 