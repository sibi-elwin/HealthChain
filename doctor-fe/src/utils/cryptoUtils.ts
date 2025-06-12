/**
 * Generates a random salt of specified length using the Web Crypto API
 * @param length Length of the salt in bytes (default: 32)
 * @returns Hex-encoded salt string
 */
export function generateSalt(length: number = 32): string {
  return Array.from(window.crypto.getRandomValues(new Uint8Array(length)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates both auth and encryption salts
 * @returns Object containing authSalt and encSalt
 */
export function generateSalts(): { authSalt: string; encSalt: string } {
  return {
    authSalt: generateSalt(),
    encSalt: generateSalt()
  };
} 