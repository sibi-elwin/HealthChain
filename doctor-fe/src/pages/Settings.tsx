import { Box, Typography, Paper } from '@mui/material';
import Layout from '../components/Layout';
import { NotificationPreferences } from '../components/NotificationPreferences';

interface SettingsProps {
  onLogout: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  return (
    <Layout onLogout={onLogout}>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <NotificationPreferences />
      </Paper>
    </Layout>
  );
} 