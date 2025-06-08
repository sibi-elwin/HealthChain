import { Contract, ContractTransaction, BigNumber } from 'ethers';

declare module './config' {
  export const blockchainConfig: {
    rpcUrl: string;
    privateKey: string;
    contractAddress: string;
    contractABI: any[];
  };
}

declare module './typechain-types' {
  export interface MedicalRecord {
    id: BigNumber;
    cid: string;
    uploader: string;
    patient: string;
    timestamp: BigNumber;
    fileType: string;
    description: string;
  }

  export class MedicalRecords__factory {
    static abi: any[];
    static connect(address: string, signerOrProvider: any): Contract;
  }
} 