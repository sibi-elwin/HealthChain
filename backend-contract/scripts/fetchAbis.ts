import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function copyAbis() {
  const sourceDir = path.join(__dirname, '../../HealthChainContract/artifacts/contracts');
  const targetDir = path.join(__dirname, '../artifacts/contracts');

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy MedicalRecords ABI
  const medicalRecordsSource = path.join(sourceDir, 'MedicalRecordContract.sol/MedicalRecordContract.json');
  const medicalRecordsTarget = path.join(targetDir, 'MedicalRecords.json');
  fs.copyFileSync(medicalRecordsSource, medicalRecordsTarget);

  // Copy AccessControl ABI
  const accessControlSource = path.join(sourceDir, 'AccessControlContract.sol/AccessControlContract.json');
  const accessControlTarget = path.join(targetDir, 'AccessControl.json');
  fs.copyFileSync(accessControlSource, accessControlTarget);

  console.log('ABIs copied successfully!');
}

copyAbis(); 