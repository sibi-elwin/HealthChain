import { getDoctorDetails } from './doctorService';

// Use Web Crypto API
const subtleCrypto = window.crypto.subtle;

// Interface for the structure stored on IPFS (This interface is now outdated for the new IPFS upload)
// interface EncryptedFileOnIPFS {
//   encryptedData: string;
//   iv: string;
//   encryptedKey?: string;
// }

export const secureStorageService = {
  // Fetch encrypted data from IPFS and decrypt it using Web Crypto API
  async decryptMedicalRecord(
    ipfsHash: string,
    encryptedAesKey: string,
    password: string,
    encSalt: string,
    doctorAddress: string
  ): Promise<Uint8Array> {
    try {
      console.log(`Fetching encrypted data from IPFS for hash: ${ipfsHash}`);
      
      // Get doctor's encrypted private key from backend
      const doctor = await getDoctorDetails(doctorAddress);
      console.log('Doctor details received:', {
        hasProfile: !!doctor?.doctorProfile,
        hasEncryptedPrivateKey: !!doctor?.doctorProfile?.encryptedPrivateKey,
        encryptedPrivateKeyLength: doctor?.doctorProfile?.encryptedPrivateKey?.length
      });
      
      if (!doctor?.doctorProfile?.encryptedPrivateKey) {
        throw new Error('Doctor encrypted private key not found');
      }

      // First, derive the KEK using the password and salt
      console.log('Deriving KEK with password and salt...');
      const kek = await this.deriveKEK(password, encSalt);
      console.log('KEK derived successfully');
      
      // Decrypt the private key using the KEK
      console.log('Attempting to decrypt private key...');
      console.log('Encrypted private key length:', doctor.doctorProfile.encryptedPrivateKey.length);
      
      // Decode the base64 encrypted private key
      const encryptedPrivateKeyData = Uint8Array.from(atob(doctor.doctorProfile.encryptedPrivateKey), c => c.charCodeAt(0));
      console.log('Decoded encrypted private key length:', encryptedPrivateKeyData.length);
      
      // For AES-GCM, the structure should be: IV (12 bytes) + ciphertext + auth tag (16 bytes)
      // The Web Crypto API expects the auth tag to be appended to the ciphertext
      const privateKeyIV = encryptedPrivateKeyData.slice(0, 12);
      const ciphertextWithTag = encryptedPrivateKeyData.slice(12); // This includes both ciphertext and auth tag

      console.log('IV length:', privateKeyIV.length);
      console.log('Ciphertext with tag length:', ciphertextWithTag.length);

      // Add detailed logging for debugging
      console.log('Full encrypted data hex (first 24 bytes):', 
        Array.from(encryptedPrivateKeyData.slice(0, 24))
          .map(b => b.toString(16).padStart(2, '0')).join(' '));
      console.log('Full encrypted data hex (last 16 bytes):', 
        Array.from(encryptedPrivateKeyData.slice(-16))
          .map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Decrypt the private key - let Web Crypto handle the auth tag
      console.log('Attempting to decrypt private key with AES-GCM...');
      const decryptedPrivateKey = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: privateKeyIV
          // Remove tagLength - Web Crypto API will handle this automatically
        },
        kek,
        ciphertextWithTag // Pass the ciphertext with auth tag appended
      );
      console.log('Private key decrypted successfully, length:', decryptedPrivateKey.byteLength);

      // Import the decrypted private key as RSA-OAEP
      console.log('Importing private key as RSA-OAEP...');
      const privateKeyCryptoKey = await subtleCrypto.importKey(
        'pkcs8',
        new Uint8Array(decryptedPrivateKey),
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );
      console.log('Private key imported successfully');
      
      // Use the private key to decrypt the AES key
      console.log('Attempting to decrypt AES key with private key...');
      console.log('Encrypted AES key length:', encryptedAesKey.length);
      const encryptedBytes = Uint8Array.from(atob(encryptedAesKey), c => c.charCodeAt(0));
      const decryptedAesKey = await subtleCrypto.decrypt(
        {
          name: 'RSA-OAEP'
        },
        privateKeyCryptoKey,
        encryptedBytes
      );
      console.log('AES key decrypted successfully, length:', decryptedAesKey.byteLength);
      
      // Import the decrypted AES key
      const aesKeyCryptoKey = await subtleCrypto.importKey(
        'raw',
        new Uint8Array(decryptedAesKey),
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
      const fileIV = combinedData.slice(0, 12);
      const ciphertext = combinedData.slice(12);

      console.log('Encrypted data fetched. Starting decryption...');

      // Decrypt the ciphertext using the imported key and IV
      const decryptedContentBuffer = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: fileIV,
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

  // Helper function to derive KEK from password and salt
  async deriveKEK(password: string, salt: string): Promise<CryptoKey> {
    try {
      // Convert password to bytes
      const passwordBytes = new TextEncoder().encode(password);
      
      // Convert salt from base64 to bytes (matching encryption)
      const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
      
      // Import the password as a raw key
      const passwordKey = await subtleCrypto.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Derive the KEK using PBKDF2
      return await subtleCrypto.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 100000,
          hash: 'SHA-256'
        },
        passwordKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error: any) {
      console.error('Error deriving KEK:', error);
      throw new Error(`Failed to derive key: ${error.message}`);
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

      // Log the first few bytes of the IV and encrypted key for debugging
      console.log('IV first bytes:', Array.from(iv.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      console.log('Encrypted key first bytes:', Array.from(encryptedKey.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));

      // Decrypt the AES key
      console.log('Attempting to decrypt with AES-GCM...');
      const decryptedKey = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: 128 // Add explicit tag length
        },
        kek,
        encryptedKey
      );
      console.log('Decryption successful, decrypted key length:', decryptedKey.byteLength);

      // Convert the decrypted key to base64 for PKCS8 import
      const decryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(decryptedKey)));
      console.log('Decrypted key converted to base64');

      return new Uint8Array(decryptedKey);
    } catch (error: any) {
      console.error('Error decrypting AES key:', error);
      if (error.name === 'OperationError') {
        console.error('OperationError details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        throw new Error('Decryption failed. The password may be incorrect or the encrypted data is corrupted.');
      }
      throw new Error(`Failed to decrypt AES key: ${error.message}`);
    }
  },

  // Helper function to decrypt with private key
  async decryptWithPrivateKey(encryptedData: string, privateKey: Uint8Array): Promise<Uint8Array> {
    try {
      // Import the private key as RSA-OAEP
      const privateKeyCryptoKey = await subtleCrypto.importKey(
        'pkcs8',
        privateKey,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['decrypt']
      );

      // Decode the base64 encrypted data
      const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Decrypt the data using RSA-OAEP
      const decryptedData = await subtleCrypto.decrypt(
        {
          name: 'RSA-OAEP'
        },
        privateKeyCryptoKey,
        encryptedBytes
      );

      return new Uint8Array(decryptedData);
    } catch (error: any) {
      console.error('Error decrypting with private key:', error);
      throw new Error(`Failed to decrypt with private key: ${error.message}`);
    }
  }
}; 