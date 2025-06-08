import jwt from "jsonwebtoken";
import { config } from "../config";
import { v4 as uuid } from "uuid";
import { verifySignature } from "../utils/verifySignature";

// Store nonces with their creation time and usage status
interface NonceData {
  nonce: string;
  createdAt: number;
  used: boolean;
  purpose: 'wallet_connection' | 'registration';
}

// Use a Map to store nonces with their purpose
const nonces = new Map<string, NonceData>();

// Clean up expired nonces (older than 15 minutes)
const cleanupNonces = () => {
  const now = Date.now();
  for (const [key, data] of nonces.entries()) {
    if (now - data.createdAt > 15 * 60 * 1000) { // 15 minutes
      nonces.delete(key);
    }
  }
};

export function generateNonce(address: string, purpose: 'wallet_connection' | 'registration' = 'wallet_connection'): string {
  cleanupNonces();
  const nonce = uuid();
  console.log(`Generating new nonce for ${purpose}:`, { address, nonce });
  
  const nonceKey = `${address}_${purpose}`;
  console.log('Storing nonce with key:', nonceKey);
  
  nonces.set(nonceKey, {
    nonce,
    createdAt: Date.now(),
    used: false,
    purpose
  });
  
  console.log('Current nonces:', Array.from(nonces.entries()).map(([key, data]) => ({
    key,
    nonce: data.nonce,
    purpose: data.purpose,
    used: data.used
  })));
  return nonce;
}

export function authenticate(address: string, signature: string, purpose: 'wallet_connection' | 'registration' = 'wallet_connection'): { token: string } {
  console.log(`Authenticating ${purpose} for address:`, address);
  console.log('Current nonces:', Array.from(nonces.entries()));
  
  const nonceKey = `${address}_${purpose}`;
  const nonceData = nonces.get(nonceKey);
  
  console.log('Found nonce data:', nonceData ? {
    nonce: nonceData.nonce,
    createdAt: new Date(nonceData.createdAt).toISOString(),
    used: nonceData.used,
    purpose: nonceData.purpose,
    age: Date.now() - nonceData.createdAt
  } : 'No nonce found');
  
  // Check if nonce exists and is valid
  if (!nonceData) {
    console.error(`No nonce found for ${purpose}:`, address);
    throw new Error("Nonce not found or expired");
  }
  
  if (nonceData.used) {
    console.error(`Nonce already used for ${purpose}:`, address);
    throw new Error("Nonce already used");
  }
  
  // Verify the signature
  console.log('Attempting to verify signature with:', {
    address,
    nonce: nonceData.nonce,
    purpose,
    signatureLength: signature.length
  });
  
  if (!verifySignature(address, signature, nonceData.nonce)) {
    console.error('Invalid signature for address:', address);
    throw new Error("Invalid signature");
  }
  
  // Mark nonce as used
  nonceData.used = true;
  nonces.set(nonceKey, nonceData);
  
  // Generate JWT token
  const token = jwt.sign(
    { 
      address,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    }, 
    config.jwtSecret
  );
  
  console.log('Token generated successfully for address:', address);
  return { token };
}

export function verifyToken(token: string): { address: string } {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { address: string };
    return { address: payload.address };
  } catch (error) {
    throw new Error("Invalid token");
  }
} 