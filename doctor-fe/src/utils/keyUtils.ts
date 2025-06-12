import { subtle } from 'crypto';

export async function generateAccessKeyPair(): Promise<{ pairPublicKey: string; privateKey: string }> {
  try {
    // Generate RSA key pair for access control
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const pairPublicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );
    const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

    return { pairPublicKey, privateKey };
  } catch (error) {
    console.error('Error generating access key pair:', error);
    throw new Error('Failed to generate access key pair');
  }
}

export async function encryptPrivateKey(privateKey: string, password: string, encSalt: string): Promise<string> {
  try {
    // Convert password to key using PBKDF2
    const passwordBuffer = new TextEncoder().encode(password);
    const saltBuffer = new TextEncoder().encode(encSalt);
    
    const key = await window.crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBuffer,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // Encrypt the private key
    const privateKeyBuffer = new TextEncoder().encode(privateKey);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      derivedKey,
      privateKeyBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Error encrypting private key:', error);
    throw new Error('Failed to encrypt private key');
  }
} 