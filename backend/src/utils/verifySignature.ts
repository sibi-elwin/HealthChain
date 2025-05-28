import { ethers } from "ethers";

export function verifySignature(address: string, signature: string, nonce: string): boolean {
  const message = `Sign this nonce to authenticate: ${nonce}`;
  const recovered = ethers.utils.verifyMessage(message, signature);
  return recovered.toLowerCase() === address.toLowerCase();
} 