import { ethers } from 'ethers';
import { ContractService } from './contractService';

export interface MedicalRecordMetadata {
  patientAddress: string;
  cid: string;
  fileType: string;
  description: string;
}

export class MedicalRecordService {
  private contractService: ContractService;

  constructor() {
    this.contractService = new ContractService();
  }

  /**
   * Get a medical record from the blockchain
   * @param recordId The ID of the record to retrieve
   * @returns The medical record data
   */
  async getMedicalRecord(recordId: number): Promise<any> {
    try {
      const record = await this.contractService.getMedicalRecord(recordId);
      return {
        id: record.id.toString(),
        cid: record.cid,
        uploader: record.uploader,
        patient: record.patient,
        timestamp: new Date(record.timestamp.toNumber() * 1000),
        fileType: record.fileType,
        description: record.description
      };
    } catch (error: any) {
      console.error('Failed to get medical record from blockchain:', error);
      throw new Error(`Failed to get medical record: ${error.message}`);
    }
  }

  /**
   * Get all medical record IDs for a patient
   * @param patientAddress The patient's wallet address
   * @returns Array of record IDs
   */
  async getPatientRecordIds(patientAddress: string): Promise<string[]> {
    try {
      const recordIds = await this.contractService.getPatientRecordIds(patientAddress);
      return recordIds.map(id => id.toString());
    } catch (error: any) {
      console.error('Failed to get patient record IDs:', error);
      throw new Error(`Failed to get patient record IDs: ${error.message}`);
    }
  }

  /**
   * Grant access to a doctor for a patient's records
   * @param patientAddress The patient's wallet address
   * @param doctorAddress The doctor's wallet address
   * @returns The transaction hash
   */
  async grantAccess(patientAddress: string, doctorAddress: string): Promise<string> {
    try {
      const tx = await this.contractService.grantAccess(patientAddress, doctorAddress);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('Failed to grant access:', error);
      throw new Error(`Failed to grant access: ${error.message}`);
    }
  }

  /**
   * Revoke access from a doctor for a patient's records
   * @param patientAddress The patient's wallet address
   * @param doctorAddress The doctor's wallet address
   * @returns The transaction hash
   */
  async revokeAccess(patientAddress: string, doctorAddress: string): Promise<string> {
    try {
      const tx = await this.contractService.revokeAccess(patientAddress, doctorAddress);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error: any) {
      console.error('Failed to revoke access:', error);
      throw new Error(`Failed to revoke access: ${error.message}`);
    }
  }

  /**
   * Check if a doctor has access to a patient's records
   * @param patientAddress The patient's wallet address
   * @param doctorAddress The doctor's wallet address
   * @returns boolean indicating if access is granted
   */
  async hasAccess(patientAddress: string, doctorAddress: string): Promise<boolean> {
    try {
      return await this.contractService.patientDoctorAccess(patientAddress, doctorAddress);
    } catch (error: any) {
      console.error('Failed to check access:', error);
      throw new Error(`Failed to check access: ${error.message}`);
    }
  }
} 