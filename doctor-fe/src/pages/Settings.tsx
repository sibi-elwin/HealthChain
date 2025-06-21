import Layout from '../components/Layout';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
  onLogout: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        
        <div className="card">
          <NotificationPreferences />
        </div>
      </div>
    </Layout>
  );
} 