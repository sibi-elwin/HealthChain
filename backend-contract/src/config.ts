import dotenv from 'dotenv';
import { MedicalRecords__factory, AccessControl__factory } from './typechain-types';

dotenv.config();

// Load contract ABIs
const medicalRecordsContractABI = MedicalRecords__factory.abi;
const accessControlContractABI = AccessControl__factory.abi;

// Validate environment variables
const requiredEnvVars = [
  'NETWORK_URL',
  'ADMIN_PRIVATE_KEY',
  'MEDICAL_RECORDS_CONTRACT',
  'ACCESS_CONTROL_CONTRACT',
  'SEPOLIA_CHAIN_ID',
  'SEPOLIA_NETWORK_NAME'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const blockchainConfig = {
  rpcUrl: process.env.NETWORK_URL!,
  privateKey: process.env.ADMIN_PRIVATE_KEY!,
  medicalRecordsContractAddress: process.env.MEDICAL_RECORDS_CONTRACT!,
  medicalRecordsContractABI: medicalRecordsContractABI,
  accessControlContractAddress: process.env.ACCESS_CONTROL_CONTRACT!,
  accessControlContractABI: accessControlContractABI,
  chainId: parseInt(process.env.SEPOLIA_CHAIN_ID!),
  network: process.env.SEPOLIA_NETWORK_NAME!,
}; 