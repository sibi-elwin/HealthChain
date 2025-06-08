export interface MedicalRecord {
  id: string;
  title: string;
  description?: string;
  ipfsHash: string;
  createdById: string;
  forUserId: string;
  accessGrants: {
    user: {
      walletAddress: string;
      name?: string;
      email?: string;
    };
    encryptedAesKey?: string;
  }[];
  blockchainTxHash?: string;
  createdAt: string;
  rawAesKey?: string;
  fileType?: string;
  aesKey?: string;
  patient: {
    id: string;
    name: string;
    walletAddress: string;
  };
} 