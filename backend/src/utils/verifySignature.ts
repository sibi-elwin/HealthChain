import { ethers } from "ethers";

export function verifySignature(address: string, signature: string, message: string): boolean {
  try {
    console.log('Verifying signature with:', {
      address,
      signature,
      message,
      addressLength: address.length,
      signatureLength: signature.length,
      messageLength: message.length
    });

    // Recover the address from the signature
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    console.log('Recovered address:', recoveredAddress);
    
    // Compare the recovered address with the provided address
    const isValid = recoveredAddress.toLowerCase() === address.toLowerCase();
    console.log('Signature verification result:', isValid);
    
    return isValid;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
} 