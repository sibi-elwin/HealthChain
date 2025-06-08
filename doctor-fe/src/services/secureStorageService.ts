


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
  async decryptMedicalRecord(ipfsHash: string, rawAesKeyHex: string): Promise<Uint8Array> {
    try {
      console.log(`Fetching encrypted data from IPFS for hash: ${ipfsHash}`);
      // Fetch the raw binary data from IPFS gateway
      const ipfsGatewayUrl = 'https://ipfs.io/ipfs/'; // Example public gateway
      const response = await fetch(`${ipfsGatewayUrl}${ipfsHash}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted file from IPFS: ${response.statusText}`);
      }

      // Get the data as ArrayBuffer (raw bytes)
      const encryptedDataWithIVBuffer = await response.arrayBuffer();
      console.log('Encrypted data with IV fetched from IPFS as ArrayBuffer.');

      // Assuming IV is the first 12 bytes (AES-GCM recommended IV length)
      const ivLength = 12;
      if (encryptedDataWithIVBuffer.byteLength < ivLength) {
          throw new Error('Encrypted data is too short to contain IV.');
      }

      const iv = new Uint8Array(encryptedDataWithIVBuffer.slice(0, ivLength));
      const encryptedContent = encryptedDataWithIVBuffer.slice(ivLength);

      console.log('IV extracted. Starting Web Crypto API decryption...');

      // Import the raw AES key (Hex string) into a CryptoKey
      const rawAesKeyBytes = Uint8Array.from(rawAesKeyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

      const aesKeyCryptoKey = await subtleCrypto.importKey(
        "raw", // format
        rawAesKeyBytes, // keyData
        {
          name: "AES-GCM",
        }, // algorithm
        false, // exportable (can be true if needed elsewhere)
        ["decrypt"] // usages
      );

      // Decrypt the data using Web Crypto API
      const decryptedContentBuffer = await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        aesKeyCryptoKey,
        encryptedContent
      );

      console.log('File decrypted successfully using Web Crypto API.');
      return new Uint8Array(decryptedContentBuffer); // Return decrypted raw bytes as Uint8Array

    } catch (error: any) {
      console.error('Error decrypting medical record with Web Crypto API:', error);
      throw new Error(error.message || 'Failed to decrypt medical record');
    }
  }
}; 