import { ContractService, UserRole } from 'backend-contract/src/services/contractService';

class BlockchainService {
  private contractService: ContractService;

  constructor() {
    this.contractService = new ContractService();
  }

  async addUserRole(walletAddress: string, role: UserRole): Promise<void> {
    try {
      const tx = await this.contractService.addUserRole(walletAddress, role);
      console.log(`Transaction sent to add role ${role} to user ${walletAddress}. Hash: ${tx.hash}`);

      await tx.wait(); // Wait for the transaction to be mined
      console.log(`Transaction confirmed. Role ${role} added to user ${walletAddress}.`);

      // Add a small delay to allow blockchain state to update
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds delay

      const hasRole = await this.contractService.hasRole(walletAddress, role);
      if (!hasRole) {
        throw new Error('Role not reflected on blockchain after waiting.');
      }

      console.log(`Role ${role} successfully verified for user ${walletAddress}.`);
    } catch (error: any) {
      console.error('Error adding user role to blockchain:', error);
      throw new Error(`Failed to add user role to blockchain: ${error.message}`);
    }
  }

  async checkUserRole(walletAddress: string, role: UserRole): Promise<boolean> {
    try {
      const hasRole = await this.contractService.hasRole(walletAddress, role);
      console.log(`User ${walletAddress} has role ${role}:`, hasRole);
      return hasRole;
    } catch (error: any) {
      console.error('Error checking user role in blockchain:', error);
      throw new Error('Failed to check user role in blockchain');
    }
  }

  async getUserRoles(walletAddress: string): Promise<UserRole[]> {
    try {
      const roles = await Promise.all(
        Object.values(UserRole).map(async (role) => ({
          role,
          hasRole: await this.contractService.hasRole(walletAddress, role)
        }))
      );
      const userRoles = roles.filter(r => r.hasRole).map(r => r.role);
      console.log(`User ${walletAddress} roles:`, userRoles);
      return userRoles;
    } catch (error: any) {
      console.error('Error getting user roles from blockchain:', error);
      throw new Error('Failed to get user roles from blockchain');
    }
  }

  async getMedicalRecord(recordId: number, fromAddress?: string): Promise<any> {
    try {
      const record = await this.contractService.getMedicalRecord(recordId, fromAddress);
      console.log(`Medical record ${recordId} retrieved`);
      return record;
    } catch (error: any) {
      console.error('Error getting medical record from blockchain:', error);
      throw new Error('Failed to get medical record from blockchain');
    }
  }

  async getPatientRecordIds(patientAddress: string, fromAddress?: string): Promise<number[]> {
    try {
      const recordIds = await this.contractService.getPatientRecordIds(patientAddress, fromAddress);
      console.log(`Record IDs retrieved for patient ${patientAddress}`);
      return recordIds.map(id => id.toNumber());
    } catch (error: any) {
      console.error('Error getting patient record IDs from blockchain:', error);
      throw new Error('Failed to get patient record IDs from blockchain');
    }
  }

  async grantAccess(patientAddress: string, doctorAddress: string): Promise<any> {
    try {
      const tx = await this.contractService.grantAccess(patientAddress, doctorAddress);
      
      await tx.wait(); // Wait for the transaction to be mined
      console.log(`Access granted to doctor ${doctorAddress} for patient ${patientAddress}. Transaction mined.`);
      console.log(`Access granted to doctor ${doctorAddress} for patient ${patientAddress}. Transaction sent. Hash: ${tx.hash}`);
      return tx;
    } catch (error: any) {
      console.error('Error granting access in blockchain:', error);
      throw new Error(`Failed to grant access in blockchain: ${error.message}`);
    }
  }

  async revokeAccess(patientAddress: string, doctorAddress: string): Promise<any> {
    try {
      const tx = await this.contractService.revokeAccess(patientAddress, doctorAddress);
      console.log(`Access revoked from doctor ${doctorAddress} for patient ${patientAddress}. Transaction sent. Hash: ${tx.hash}`);
      await tx.wait(); // Wait for the transaction to be mined
      console.log(`Access revoked from doctor ${doctorAddress} for patient ${patientAddress}. Transaction mined.`);
      return tx;
    } catch (error: any) {
      console.error('Error revoking access in blockchain:', error);
      throw new Error(`Failed to revoke access in blockchain: ${error.message}`);
    }
  }

  async checkAccess(patientAddress: string, doctorAddress: string): Promise<boolean> {
    try {
      const hasAccess = await this.contractService.patientDoctorAccess(patientAddress, doctorAddress);
      console.log(`Doctor ${doctorAddress} has access to patient ${patientAddress}:`, hasAccess);
      return hasAccess;
    } catch (error: any) {
      console.error('Error checking access in blockchain:', error);
      throw new Error('Failed to check access in blockchain');
    }
  }
}

export const blockchainService = new BlockchainService(); 