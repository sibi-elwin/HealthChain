import { ethers } from 'ethers';
import MedicalRecordsABI from './abis/MedicalRecords.json';

const MEDICAL_RECORDS_CONTRACT_ADDRESS = import.meta.env.VITE_MEDICAL_RECORDS_CONTRACT_ADDRESS;

export async function addMedicalRecordOnChain(
  signer: ethers.Signer,
  patientAddress: string,
  ipfsHash: string,
  fileType: string,
  description: string
) {
  const contract = new ethers.Contract(
    MEDICAL_RECORDS_CONTRACT_ADDRESS,
    MedicalRecordsABI.abi,
    signer
  );
  const tx = await contract.addRecord(patientAddress, ipfsHash, fileType, description);
  await tx.wait();
  return tx.hash;
}

export async function grantAccessOnChain(signer: ethers.Signer, contractAddress: string, doctorAddress: string) {
  const contract = new ethers.Contract(contractAddress, MedicalRecordsABI.abi, signer);
  const tx = await contract.grantAccess(doctorAddress);
  await tx.wait();
  return tx.hash;
} 