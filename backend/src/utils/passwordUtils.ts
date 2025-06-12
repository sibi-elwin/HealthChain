import crypto from 'crypto';

export function hashPassword(password: string, salt: string): string {
  // Use PBKDF2 to hash the password with the salt
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000, // Number of iterations
    64, // Key length in bytes
    'sha512' // Hash function
  );

  // Return the hash as a hex string
  return hash.toString('hex');
}

export function verifyPassword(password: string, hashedPassword: string, salt: string): boolean {
  // Hash the provided password with the same salt
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    100000, // Number of iterations
    64, // Key length in bytes
    'sha512' // Hash function
  );

  // Compare the hashes
  return hash.toString('hex') === hashedPassword;
}