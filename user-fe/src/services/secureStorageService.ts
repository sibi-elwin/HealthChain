import pinataSDK from '@pinata/sdk';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import { addMedicalRecordOnChain, grantAccessOnChain } from './blockchainService';

// Polyfill Buffer for browser
window.Buffer = window.Buffer || Buffer;

// Use Web Crypto API
const subtleCrypto = window.crypto.subtle;

// Configure Pinata client with JWT
const pinataJWT = import.meta.env.VITE_PINATA_JWT_TOKEN?.trim();

console.log('Pinata JWT Token:', pinataJWT ? 'Present' : 'Missing');

if (!pinataJWT) {
  throw new Error('Pinata JWT token not found in environment variables');
}

// Test Pinata permissions
const testPinataPermissions = async () => {
  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: {
        'Authorization': `Bearer ${pinataJWT}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Pinata permissions verified');
      return true;
    } else {
      console.error('❌ Pinata permission issue:', response.status);
      const errorData = await response.json();
      console.error('Error details:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Pinata test failed:', error);
    return false;
  }
};

// Test permissions before allowing uploads
testPinataPermissions().then(hasPermissions => {
  if (!hasPermissions) {
    console.error('Pinata permissions check failed. Please verify your JWT token and permissions.');
  }
});

const pinata = new pinataSDK(pinataJWT);

export interface EncryptedFile {
  encryptedData: string;
  iv: string;
}

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
}

// Interface for NFT.Storage metadata
export interface NFTStorageMetadata {
  metadataCID: string;
  imageCID: string;
  blockchain: string;
  contractAddress: string;
  tokenId: string;
}

export const secureStorageService = {
  // Generate AES key for encryption
  async generateAESKey(): Promise<CryptoKey> {
    try {
      const key = await subtleCrypto.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );
      return key;
    } catch (error) {
      console.error('Error generating AES key:', error);
      throw new Error('Failed to generate encryption key');
    }
  },

  // Encrypt file with AES-GCM using Web Crypto API (accepts CryptoKey)
  async encryptFile(file: File, aesKey: CryptoKey): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as ArrayBuffer;

          // Generate random IV (96 bits recommended for AES-GCM)
          const iv = window.crypto.getRandomValues(new Uint8Array(12));

          // Encrypt the file data
          const encryptedContent = await subtleCrypto.encrypt(
            {
              name: "AES-GCM",
              iv: iv,
            },
            aesKey,
            fileData
          );

          // Prepend IV to the encrypted data for storage
          const combinedData = new Uint8Array(iv.length + encryptedContent.byteLength);
          combinedData.set(iv, 0);
          combinedData.set(new Uint8Array(encryptedContent), iv.length);

          console.log('File encrypted successfully using Web Crypto API.');
          resolve(combinedData.buffer); // Return as ArrayBuffer

        } catch (error: any) {
          console.error('Web Crypto API encryption error:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file for encryption'));
      reader.readAsArrayBuffer(file);
    });
  },

  // Upload encrypted data (ArrayBuffer) to IPFS via Pinata
  async uploadToIPFS(encryptedDataBuffer: ArrayBuffer): Promise<string> {
    try {
      // First verify permissions
      const hasPermissions = await testPinataPermissions();
      if (!hasPermissions) {
        throw new Error('Pinata permissions not verified. Please check your JWT token and permissions.');
      }

      console.log('Starting Pinata upload...');
      
      // Create a Blob directly from the ArrayBuffer
      const blob = new Blob([encryptedDataBuffer], { type: 'application/octet-stream' }); // Use a generic binary type
      
      // Create FormData and append the blob
      const formData = new FormData();
      formData.append('file', blob, 'encrypted-medical-record'); // Use a generic filename
      
      // Add metadata
      formData.append('pinataMetadata', JSON.stringify({
        name: 'encrypted-medical-record',
        keyvalues: {
          type: 'medical-record',
          encrypted: 'true'
        }
      }));
      
      // Add options
      formData.append('pinataOptions', JSON.stringify({
        cidVersion: 0
      }));
      
      // Upload to Pinata using fetch with JWT
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pinataJWT}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Pinata upload failed:', errorData);
        throw new Error(`Pinata upload failed: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Pinata upload successful, CID:', result.IpfsHash);
      return result.IpfsHash;
    } catch (error) {
      console.error('Pinata upload error details:', error);
      throw new Error('Failed to upload to IPFS');
    }
  },

  // Prepare NFT.Storage metadata structure
  async prepareNFTStorageMetadata(
    metadataCID: string,
    imageCID: string,
    contractAddress: string,
    tokenId: string
  ): Promise<NFTStorageMetadata> {
    return {
      metadataCID,
      imageCID,
      blockchain: 'ethereum', // or other blockchain
      contractAddress,
      tokenId
    };
  },

  // Upload medical record with encryption
  async uploadMedicalRecord(
    file: File,
    patientWalletAddress: string,
    description?: string
  ): Promise<{ record: MedicalRecord, rawAesKey: string }> {
    try {
      // Generate AES key (as CryptoKey)
      const aesKeyCryptoKey = await this.generateAESKey();

      // Encrypt file with the CryptoKey
      const encryptedContentBuffer = await this.encryptFile(file, aesKeyCryptoKey);

      // Export the raw key bytes as Hex string for storage/transfer
      const rawAesKeyBytes = await subtleCrypto.exportKey('raw', aesKeyCryptoKey);
      const rawAesKey = Buffer.from(rawAesKeyBytes).toString('hex'); // Convert ArrayBuffer to Hex string
      console.log('Generated raw AES key (Hex):', rawAesKey); // Log for understanding

      // Upload the encrypted data (ArrayBuffer) to IPFS via Pinata
      const ipfsHash = await this.uploadToIPFS(encryptedContentBuffer);

      // Get signer from MetaMask for on-chain transaction
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress(); // This should be the patient's address

      // Add record on-chain using patient's wallet
      const fileType = file.type || '';
      console.log('Address',userAddress);
      // Assuming addMedicalRecordOnChain takes signer, patientAddress, ipfsHash, fileType, description
      const txHash = await addMedicalRecordOnChain(
        signer,
        userAddress, // Use the connected patient's address
        ipfsHash,
        fileType,
        description || ''
      );

      // Notify backend for off-chain storage/audit
      // Use the patient's wallet address in the URL
      const response = await fetch(`http://localhost:4000/api/user/${userAddress}/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming this endpoint is protected
        },
        body: JSON.stringify({
          title: file.name,
          description,
          ipfsHash,
          blockchainTxHash: txHash,
          fileType: fileType,
          // Include the raw AES key in the backend request (INSECURE - as it was before)
          rawAesKey: rawAesKey
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to save medical record metadata');
      }

      const { data } = await response.json();
      // Return the record data along with the generated raw AES key
      return { ...data.record, rawAesKey };

    } catch (error: any) {
      console.error('Medical record upload error:', error);
      throw new Error(error.message || 'Failed to upload medical record');
    }
  },

  // Fetch encrypted data from IPFS and decrypt it using Web Crypto API (Revert to using rawAesKey)
  // This function will be used for decryption by both patients (using rawAesKey from DB)
  // and doctors (using encryptedAesKey from AccessGrant, which stored the raw key).
  async decryptMedicalRecord(
    ipfsHash: string,
    rawAesKeyHex: string // Accept the raw AES key as Hex string
  ): Promise<Uint8Array> {
    try {
      console.log(`Fetching encrypted data from IPFS for hash: ${ipfsHash}`);
      // Fetch the combined IV + ciphertext data from IPFS gateway as ArrayBuffer
      const ipfsGatewayUrl = 'https://ipfs.io/ipfs/'; // Example public gateway
      const response = await fetch(`${ipfsGatewayUrl}${ipfsHash}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted file from IPFS: ${response.statusText}`);
      }

      // Get the data as ArrayBuffer
      const combinedDataBuffer = await response.arrayBuffer();
      const combinedData = new Uint8Array(combinedDataBuffer);

      // Separate IV (first 12 bytes for AES-GCM) and ciphertext
      const iv = combinedData.slice(0, 12);
      const ciphertext = combinedData.slice(12);

      console.log('Encrypted data (combined IV+ciphertext) fetched. Separating IV and ciphertext...');
      console.log('IV (Uint8Array, first 12 bytes):', iv.slice(0, 12));
      console.log('IV length:', iv.length);
      console.log('Ciphertext (Uint8Array, first 10 bytes):', ciphertext.slice(0, 10));
      console.log('Ciphertext size:', ciphertext.length);

      // Import the raw AES key (Hex string) into a CryptoKey
      const keyBytes = new Uint8Array(rawAesKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))); // Revert byte type hint if not needed before
      const aesKeyCryptoKey = await subtleCrypto.importKey(
        'raw',
        keyBytes,
        {
          name: "AES-GCM",
        },
        true, // exportable (can be false if not needed)
        ["encrypt", "decrypt"]
      );

      console.log('Imported AES-GCM CryptoKey. Starting decryption...');

      // Decrypt the ciphertext using the imported key and IV
      const decryptedContentBuffer = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKeyCryptoKey,
        ciphertext
      );

      console.log('Web Crypto API decryption operation complete.');
      console.log('File decrypted successfully using Web Crypto API.');
      return new Uint8Array(decryptedContentBuffer); // Return decrypted data as Uint8Array

    } catch (error: any) {
      console.error('Error decrypting medical record with Web Crypto API:', error);
      if (error.name === 'OperationError') {
        console.error('Possible cause: Authentication Tag Mismatch (incorrect key, IV, or ciphertext).');
      }
      throw new Error(error.message || 'Failed to decrypt medical record');
    }
  },

  // Grant access to a doctor (Revert to passing rawAesKey to backend)
  // This function is called by the patient to grant a doctor access.
  async grantAccess(
    recordId: string,
    patientWalletAddress: string, // Patient granting access
    doctorWalletAddress: string,
    rawAesKey: string // The raw AES key (Hex string) for the record - passed from patient's record data
  ): Promise<void> {
    try {
      if (!window.ethereum) throw new Error('MetaMask is not installed');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const connectedAddress = await signer.getAddress();

      // Ensure the connected wallet is the patient granting access
      if (connectedAddress.toLowerCase() !== patientWalletAddress.toLowerCase()) {
          throw new Error('Connected wallet address does not match the patient granting access.');
      }

      // Call the contract using the patient's wallet (via the signer) to grant access on-chain
      console.log(`Initiating on-chain access grant for record ${recordId} to doctor ${doctorWalletAddress} by patient ${connectedAddress}...`);

      // You need to know the MedicalRecords contract address (from config or env)
      const contractAddress = import.meta.env.VITE_MEDICAL_RECORDS_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error('MedicalRecords contract address not set');

      // Call grantAccessOnChain with signer, contractAddress, doctorAddress (3 arguments as per blockchainService)
      const transactionHash = await grantAccessOnChain(signer, contractAddress, doctorWalletAddress);

      console.log('On-chain grant transaction confirmed:', transactionHash);

      // Notify backend to record the grant in the database after on-chain confirmation
      console.log('Notifying backend to record access grant in database...');
      // Assuming the backend endpoint is /api/user/:walletAddress/medical-records/:recordId/access-granted-db
      // Use the patient's wallet address in the URL
      const dbRecordResponse = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}/medical-records/${recordId}/access-granted-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming this endpoint is protected
        },
        body: JSON.stringify({
          doctorAddress: doctorWalletAddress,
          transactionHash, // Pass transaction hash
          // Pass the raw AES key to the backend to be stored in the AccessGrant (INSECURE - as it was before)
          encryptedAesKey: rawAesKey // The backend field name is misleading, it stored the raw key here
        }),
      });

      if (!dbRecordResponse.ok) {
        const errorData = await dbRecordResponse.json();
        console.error('Failed to record access grant in backend DB:', errorData);
        console.warn('Access granted on-chain, but failed to record in backend database.');
        // Depending on requirements, you might want to revert the on-chain transaction
        // or have a separate process to reconcile DB and blockchain state.
        throw new Error(`Failed to record access grant in database: ${errorData.error || dbRecordResponse.statusText}`);
      } else {
        console.log('Access grant successfully recorded in backend database.');
      }

    } catch (error: any) {
      console.error('Error granting access:', error);
      const errorMessage = error.message || 'Failed to grant access';
      throw new Error(errorMessage);
    }
  },

  // Revoke access from a doctor
  async revokeAccess(recordId: string, walletAddress: string, doctorAddress: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:4000/api/user/${walletAddress}/medical-records/${recordId}/revoke-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ doctorAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke access');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to revoke access');
    }
  },

  // Get medical records for a user (Patient viewing their own records)
  // This function is called by the patient to view their own records.
  async getMedicalRecords(patientWalletAddress: string): Promise<MedicalRecord[]> {
    try {
      const response = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}/medical-records`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Assuming this endpoint is protected
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch medical records');
      }

      const { data } = await response.json();
      // Map the backend's rawAesKey to the frontend's aesKey for compatibility with old code
      const recordsWithRawAesKey = data.records.map((record: any) => ({
          ...record,
          // Map the backend's rawAesKey to the frontend's aesKey
          // This is where the patient gets the raw key for decryption
          aesKey: record.rawAesKey // This was the old structure
      }));

      return recordsWithRawAesKey;
    } catch (error: any) {
      console.error('Error fetching medical records:', error);
      throw new Error(error.message || 'Failed to fetch medical records');
    }
  }
}; 