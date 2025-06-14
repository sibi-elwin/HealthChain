import pinataSDK from '@pinata/sdk';
import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import { addMedicalRecordOnChain, grantAccessOnChain } from './blockchainService';
import { getDoctorDetails } from './doctorService';

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
  fileType?: string;
  encryptedAesKeyForPatient?: string;
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

  // Derive Key Encryption Key (KEK) using PBKDF2
  async deriveKEK(password: string, salt: string): Promise<CryptoKey> {
    try {
      // Convert password and salt to Uint8Array
      const passwordBuffer = new TextEncoder().encode(password);
      const saltBuffer = new TextEncoder().encode(salt);

      // Import password as raw key material
      const passwordKey = await subtleCrypto.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive KEK using PBKDF2
      const kek = await subtleCrypto.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000, // High iteration count for security
          hash: 'SHA-256'
        },
        passwordKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false, // Not extractable
        ['encrypt', 'decrypt']
      );

      return kek;
    } catch (error) {
      console.error('Error deriving KEK:', error);
      throw new Error('Failed to derive encryption key');
    }
  },

  // Encrypt AES key with KEK
  async encryptAESKeyWithKEK(aesKey: CryptoKey, kek: CryptoKey): Promise<string> {
    try {
      // Export the AES key as raw bytes
      const rawAesKey = await subtleCrypto.exportKey('raw', aesKey);
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the AES key with KEK
      const encryptedAesKey = await subtleCrypto.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        kek,
        rawAesKey
      );

      // Combine IV and encrypted data
      const combinedData = new Uint8Array(iv.length + encryptedAesKey.byteLength);
      combinedData.set(iv, 0);
      combinedData.set(new Uint8Array(encryptedAesKey), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combinedData));
    } catch (error) {
      console.error('Error encrypting AES key:', error);
      throw new Error('Failed to encrypt AES key');
    }
  },

  // Upload medical record with encryption
  async uploadMedicalRecord(
    file: File,
    patientWalletAddress: string,
    description?: string,
    password?: string
  ): Promise<{ record: MedicalRecord, rawAesKey: string }> {
    try {
      if (!password) {
        throw new Error('Password is required for encryption');
      }

      // Get user's encSalt from backend
      const userResponse = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { data: { user } } = await userResponse.json();
      if (!user.encSalt) {
        throw new Error('User encryption salt not found');
      }

      // Generate AES key for file encryption
      const aesKeyCryptoKey = await this.generateAESKey();

      // Encrypt file with the AES key
      const encryptedContentBuffer = await this.encryptFile(file, aesKeyCryptoKey);

      // Derive KEK using password and encSalt
      const kek = await this.deriveKEK(password, user.encSalt);

      // Encrypt the AES key with KEK
      const encryptedAesKey = await this.encryptAESKeyWithKEK(aesKeyCryptoKey, kek);

      // Export the raw AES key for immediate use
      const rawAesKeyBytes = await subtleCrypto.exportKey('raw', aesKeyCryptoKey);
      const rawAesKey = Buffer.from(rawAesKeyBytes).toString('hex');

      // Upload the encrypted data to IPFS
      const ipfsHash = await this.uploadToIPFS(encryptedContentBuffer);

      // Get signer from MetaMask for on-chain transaction
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();

      // Add record on-chain
      const contractAddress = import.meta.env.VITE_MEDICAL_RECORDS_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error('MedicalRecords contract address not set');

      const txHash = await addMedicalRecordOnChain(
        signer,
        patientWalletAddress,
        ipfsHash,
        file.type,
        description || ''
      );
      console.log('On-chain record added, transaction hash:', txHash);

      // Save record metadata in backend
      const response = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: file.name,
          description: description || '',
          ipfsHash: ipfsHash,
          blockchainTxHash: txHash,
          fileType: file.type,
          encryptedAesKeyForPatient: encryptedAesKey // Send encrypted AES key instead of raw key
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Failed to save medical record metadata');
      }

      const { data } = await response.json();
      // Return the record data along with the raw AES key for immediate use
      return { ...data.record, rawAesKey };

    } catch (error: any) {
      console.error('Medical record upload error:', error);
      throw new Error(error.message || 'Failed to upload medical record');
    }
  },

  // Fetch encrypted data from IPFS and decrypt it using Web Crypto API
  async decryptMedicalRecord(
    ipfsHash: string,
    encryptedAesKey: string,
    password: string,
    encSalt: string
  ): Promise<Uint8Array> {
    try {
      console.log(`Fetching encrypted data from IPFS for hash: ${ipfsHash}`);
      
      // First, derive the KEK using the password and salt
      const kek = await this.deriveKEK(password, encSalt);
      
      // Decrypt the AES key using the KEK
      const decryptedAesKey = await this.decryptAESKeyWithKEK(encryptedAesKey, kek);
      
      // Import the decrypted AES key
      const aesKeyCryptoKey = await subtleCrypto.importKey(
        'raw',
        decryptedAesKey,
        {
          name: "AES-GCM",
        },
        true,
        ["encrypt", "decrypt"]
      );

      // Fetch the encrypted file from IPFS
      const ipfsGatewayUrl = 'https://ipfs.io/ipfs/';
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

      console.log('Encrypted data fetched. Starting decryption...');

      // Decrypt the ciphertext using the imported key and IV
      const decryptedContentBuffer = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKeyCryptoKey,
        ciphertext
      );

      console.log('File decrypted successfully.');
      return new Uint8Array(decryptedContentBuffer);

    } catch (error: any) {
      console.error('Error decrypting medical record:', error);
      if (error.name === 'OperationError') {
        throw new Error('Decryption failed. Please check your password and try again.');
      }
      throw new Error(error.message || 'Failed to decrypt medical record');
    }
  },

  // Helper function to decrypt AES key with KEK
  async decryptAESKeyWithKEK(encryptedAesKey: string, kek: CryptoKey): Promise<Uint8Array> {
    try {
      console.log('Decrypting AES key with KEK...');
      console.log('Encrypted AES key length:', encryptedAesKey.length);
      
      // Decode the base64 encrypted AES key
      const encryptedData = Uint8Array.from(atob(encryptedAesKey), c => c.charCodeAt(0));
      console.log('Decoded encrypted data length:', encryptedData.length);
      
      // Separate IV (first 12 bytes) and encrypted key
      const iv = encryptedData.slice(0, 12);
      const encryptedKey = encryptedData.slice(12);
      console.log('IV length:', iv.length);
      console.log('Encrypted key length:', encryptedKey.length);

      // Decrypt the AES key
      console.log('Attempting to decrypt with AES-GCM...');
      const decryptedKey = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        kek,
        encryptedKey
      );
      console.log('Decryption successful, decrypted key length:', decryptedKey.byteLength);

      return new Uint8Array(decryptedKey);
    } catch (error: any) {
      console.error('Error decrypting AES key:', error);
      throw new Error(`Failed to decrypt AES key: ${error.message}`);
    }
  },

  // Grant access to a doctor (Revert to passing rawAesKey to backend)
  // This function is called by the patient to grant a doctor access.
  async grantAccess(
    recordId: string,
    patientWalletAddress: string, // Patient granting access
    doctorWalletAddress: string,
    encryptedAesKey: string, // The encrypted AES key from patient's record
    password: string // Add password parameter
  ): Promise<void> {
    try {
      if (!window.ethereum) throw new Error('MetaMask is not installed');
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const connectedAddress = await signer.getAddress();

      // Ensure the connected wallet is the patient granting access
      if (connectedAddress.toLowerCase() !== patientWalletAddress.toLowerCase()) {
          throw new Error('Connected wallet address does not match the patient granting access.');
      }

      // Get doctor details including their public key
      const doctor = await getDoctorDetails(doctorWalletAddress);

      if (!doctor?.doctorProfile?.pairPublicKey) {
        throw new Error('Doctor access control public key not found');
      }

      // Get patient's encSalt from backend
      const patientResponse = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!patientResponse.ok) {
        throw new Error('Failed to fetch patient data');
      }

      const { data: { user: patient } } = await patientResponse.json();
      if (!patient.encSalt) {
        throw new Error('Patient encryption salt not found');
      }

      // Decrypt the AES key using the patient's password
      const kek = await this.deriveKEK(password, patient.encSalt);
      const decryptedAesKey = await this.decryptAESKeyWithKEK(encryptedAesKey, kek);

      // Encrypt the AES key with the doctor's public key
      const reencryptedAesKey = await this.encryptWithPublicKey(decryptedAesKey, doctor.doctorProfile.pairPublicKey);

      // Call the contract using the patient's wallet (via the signer) to grant access on-chain
      console.log(`Initiating on-chain access grant for record ${recordId} to doctor ${doctorWalletAddress} by patient ${connectedAddress}...`);

      const contractAddress = import.meta.env.VITE_MEDICAL_RECORDS_CONTRACT_ADDRESS;
      if (!contractAddress) throw new Error('MedicalRecords contract address not set');

      const transactionHash = await grantAccessOnChain(signer, contractAddress, doctorWalletAddress);
      console.log('On-chain grant transaction confirmed:', transactionHash);

      // Notify backend to record the grant in the database after on-chain confirmation
      console.log('Notifying backend to record access grant in database...');
      const dbRecordResponse = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}/medical-records/${recordId}/access-granted-db`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          doctorAddress: doctorWalletAddress,
          transactionHash,
          encryptedAesKey: reencryptedAesKey // Send the re-encrypted AES key
        }),
      });

      if (!dbRecordResponse.ok) {
        const errorData = await dbRecordResponse.json();
        console.error('Failed to record access grant in backend DB:', errorData);
        console.warn('Access granted on-chain, but failed to record in backend database.');
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
  async getMedicalRecords(patientWalletAddress: string): Promise<MedicalRecord[]> {
    try {
      const response = await fetch(`http://localhost:4000/api/user/${patientWalletAddress}/medical-records`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch medical records');
      }

      const { data } = await response.json();
      return data.records;
    } catch (error: any) {
      console.error('Error fetching medical records:', error);
      throw new Error(error.message || 'Failed to fetch medical records');
    }
  },

  async encryptWithPublicKey(rawAesKey: Uint8Array, doctorPublicKey: string): Promise<string> {
    try {
      console.log('Starting encryption with public key...');
      
      // Convert the raw AES key to a format suitable for encryption
      const aesKeyBuffer = new Uint8Array(rawAesKey);
      console.log('AES key buffer length:', aesKeyBuffer.length);
      
      // Convert the public key from base64 to ArrayBuffer
      const publicKeyBuffer = Uint8Array.from(atob(doctorPublicKey), c => c.charCodeAt(0));
      console.log('Public key buffer length:', publicKeyBuffer.length);
      
      // Import the public key in SPKI format
      const publicKey = await subtleCrypto.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );
      console.log('Public key imported successfully');
      
      // Encrypt the AES key with the public key
      const encryptedBuffer = await subtleCrypto.encrypt(
        {
          name: 'RSA-OAEP'
        },
        publicKey,
        aesKeyBuffer
      );
      console.log('AES key encrypted successfully');
      
      // Convert the encrypted buffer to base64
      const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      console.log('Encryption completed successfully');
      
      return encryptedBase64;
    } catch (error: any) {
      console.error('Error in encryptWithPublicKey:', error);
      throw new Error(`Failed to encrypt with public key: ${error.message}`);
    }
  },

  async reencryptAesKeyForDoctor(
    patientPassword: string,
    patientEncSalt: string,
    doctorPublicKey: string,
    encryptedAesKey: string
  ): Promise<string> {
    try {
      // Validate inputs
      if (!patientPassword || !patientEncSalt || !doctorPublicKey || !encryptedAesKey) {
        throw new Error('Missing required parameters for reencryption');
      }

      // 1. Derive KEK from patient's password and encSalt
      const patientKEK = await this.deriveKEK(patientPassword, patientEncSalt);
      
      // 2. Decrypt the AES key using patient's KEK
      const rawAesKey = await this.decryptAESKeyWithKEK(encryptedAesKey, patientKEK);
      
      // 3. Validate the decrypted AES key
      if (!rawAesKey || rawAesKey.length === 0) {
        throw new Error('Failed to decrypt AES key with patient credentials');
      }

      // 4. Encrypt the raw AES key with doctor's public key
      const reencryptedKey = await this.encryptWithPublicKey(rawAesKey, doctorPublicKey);
      
      // 5. Validate the reencrypted key
      if (!reencryptedKey) {
        throw new Error('Failed to reencrypt AES key with doctor\'s public key');
      }

      return reencryptedKey;
    } catch (error) {
      console.error('Error reencrypting AES key:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to reencrypt AES key: ${error.message}`);
      }
      throw new Error('Failed to reencrypt AES key');
    }
  }
}; 