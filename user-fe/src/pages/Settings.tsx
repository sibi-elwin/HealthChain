import { Box, Typography, Container } from '@mui/material';
import Layout from '../components/Layout';
import { NotificationPreferences } from '../components/NotificationPreferences';

interface SettingsProps {
  onLogout: () => void;
}

export default function Settings({ onLogout }: SettingsProps) {
  return (
    <Layout onLogout={onLogout}>
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <Box sx={{ mt: 4 }}>
          <NotificationPreferences />
        </Box>
      </Container>
    </Layout>
  );
} 