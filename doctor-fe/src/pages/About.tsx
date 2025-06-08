import { Box, Typography, Paper } from '@mui/material';
import Layout from '../components/Layout';

interface AboutProps {
  onLogout: () => void;
}

export default function About({ onLogout }: AboutProps) {
  return (
    <Layout onLogout={onLogout}>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          About HealthChain
        </Typography>
      </Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="body1" paragraph>
          HealthChain is a decentralized application designed to empower patients with control over their medical data.
          It leverages blockchain technology and IPFS to ensure secure, transparent, and immutable storage of medical records.
        </Typography>
        <Typography variant="body1" paragraph>
          Doctors can request access to patient records, and patients can grant or revoke this access at any time.
          All interactions are recorded on the blockchain, providing an auditable trail of data access.
        </Typography>
        <Typography variant="body1" paragraph>
          Our mission is to create a more secure, efficient, and patient-centric healthcare data management system.
        </Typography>
      </Paper>
    </Layout>
  );
} 