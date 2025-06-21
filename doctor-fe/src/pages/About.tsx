import Layout from '../components/Layout';
import { Info } from 'lucide-react';

interface AboutProps {
  onLogout: () => void;
}

export default function About({ onLogout }: AboutProps) {
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Info className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">About HealthChain</h1>
        </div>
        
        <div className="card">
          <div className="space-y-4 text-gray-700">
            <p>
              HealthChain is a decentralized application designed to empower patients with control over their medical data.
              It leverages blockchain technology and IPFS to ensure secure, transparent, and immutable storage of medical records.
            </p>
            <p>
              Doctors can request access to patient records, and patients can grant or revoke this access at any time.
              All interactions are recorded on the blockchain, providing an auditable trail of data access.
            </p>
            <p>
              Our mission is to create a more secure, efficient, and patient-centric healthcare data management system.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 