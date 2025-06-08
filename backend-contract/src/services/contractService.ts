import { ethers } from 'ethers';
import { blockchainConfig } from '../config';
import { AccessControl__factory, MedicalRecords__factory, AccessControl, MedicalRecords } from '../typechain-types';

export enum UserRole {
  ADMIN = 'ADMIN_ROLE',
  DOCTOR = 'DOCTOR_ROLE',
  PATIENT = 'PATIENT_ROLE',
  LAB = 'LAB_ROLE'
}

export class ContractService {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private medicalRecordsContract: MedicalRecords;
  private accessControlContract: AccessControl;

  constructor() {
    // Initialize provider
    this.provider = new ethers.providers.JsonRpcProvider(blockchainConfig.rpcUrl, {
      chainId: blockchainConfig.chainId,
      name: blockchainConfig.network
    });

    // Initialize wallet with private key
    this.wallet = new ethers.Wallet(blockchainConfig.privateKey, this.provider);

    // Initialize contracts
    this.medicalRecordsContract = MedicalRecords__factory.connect(
      blockchainConfig.medicalRecordsContractAddress!,
      this.wallet
    );

    this.accessControlContract = AccessControl__factory.connect(
      blockchainConfig.accessControlContractAddress!,
      this.wallet
    );
  }

  /**
   * Add a user role
   */
  async addUserRole(walletAddress: string, role: UserRole): Promise<ethers.ContractTransaction> {
    try {
      const roleBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
      const tx = await this.accessControlContract.grantRole(roleBytes, walletAddress);
      return tx; // Return the transaction object directly
    } catch (error: any) {
      console.error('Contract grantRole error:', error);
      throw new Error(`Failed to add role: ${error.message}`);
    }
  }

  /**
   * Remove a user role
   */
  async removeUserRole(userAddress: string, role: UserRole): Promise<ethers.ContractTransaction> {
    try {
      const roleBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
      const tx = await this.accessControlContract.revokeRole(roleBytes, userAddress);
      return tx; // Return the transaction object directly
    } catch (error: any) {
      console.error('Contract revokeRole error:', error);
      throw new Error(`Failed to remove role: ${error.message}`);
    }
  }

  /**
   * Check if a user has a specific role
   */
  async hasRole(userAddress: string, role: UserRole): Promise<boolean> {
    try {
      const roleBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(role));
      return await this.accessControlContract.hasRole(roleBytes, userAddress);
    } catch (error: any) {
      console.error('Contract hasRole error:', error);
      throw new Error(`Failed to check role: ${error.message}`);
    }
  }

  /**
   * Add a medical record to the blockchain
   */
  

  /**
   * Get a medical record from the blockchain
   */
  async getMedicalRecord(recordId: number, fromAddress?: string): Promise<any> {
    const contract = this.medicalRecordsContract.connect(this.provider);
    if (fromAddress) {
      return await contract.getRecord(recordId, { from: fromAddress });
    } else {
      return await contract.getRecord(recordId);
    }
  }

  /**
   * Get all medical record IDs for a patient
   */
  async getPatientRecordIds(patientAddress: string, fromAddress?: string): Promise<ethers.BigNumber[]> {
    // Use provider for read-only call
    const contract = this.medicalRecordsContract.connect(this.provider);
    // If fromAddress is provided, use call overrides
    if (fromAddress) {
      return await contract.getPatientRecordIds(patientAddress, { from: fromAddress });
    } else {
      return await contract.getPatientRecordIds(patientAddress);
    }
  }

  /**
   * Grant access to a doctor
   */
  async grantAccess(patientAddress: string, doctorAddress: string): Promise<ethers.ContractTransaction> {
    try {
      // Call the grantAccess function on the MedicalRecords contract
      // The backend wallet must be the patient (msg.sender)
      const tx = await this.medicalRecordsContract.grantAccess(doctorAddress);
      return tx;
    } catch (error: any) {
      console.error('Contract grantAccess error:', error);
      throw new Error(`Failed to grant access: ${error.message}`);
    }
  }

  /**
   * Revoke access from a doctor
   */
  async revokeAccess(patientAddress: string, doctorAddress: string): Promise<ethers.ContractTransaction> {
    try {
      // Call the revokeAccess function on the MedicalRecords contract
      // The backend wallet must be the patient (msg.sender)
      const tx = await this.medicalRecordsContract.revokeAccess(doctorAddress);
      return tx;
    } catch (error: any) {
      console.error('Contract revokeAccess error:', error);
      throw new Error(`Failed to revoke access: ${error.message}`);
    }
  }

  /**
   * Check if a doctor has access to a patient's records
   */
  async patientDoctorAccess(patientAddress: string, doctorAddress: string): Promise<boolean> {
    try {
      // The contract function checks if the caller (backend wallet) has access.
      // This might need adjustment depending on how access is managed off-chain.
      return await this.medicalRecordsContract.patientDoctorAccess(patientAddress, doctorAddress);
    } catch (error: any) {
      console.error('Contract patientDoctorAccess error:', error);
      throw new Error('Failed to check access in blockchain');
    }
  }

  /**
   * Get all patients a doctor has access to
   * Note: This function does not exist in the MedicalRecordContract.sol provided.
   * This function call will likely result in an error.
   */
  async getDoctorAccess(doctorAddress: string): Promise<string[]> {
    try {
       // This function does not appear to be in the MedicalRecordContract based on the ABI.
       // This call will likely fail.
      // return await this.medicalRecordsContract.getDoctorAccess(doctorAddress); // This function does not exist
      console.warn("getDoctorAccess function called, but it does not exist in MedicalRecordContract.");
      return []; // Return empty array or handle appropriately
    } catch (error: any) {
      console.error('Contract getDoctorAccess error:', error);
      throw new Error('Failed to get doctor access: ${error.message}');
    }
  }
}
