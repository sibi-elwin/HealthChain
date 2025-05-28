import jwt from "jsonwebtoken";
import { config } from "../config";
import { v4 as uuid } from "uuid";
import { verifySignature } from "../utils/verifySignature";

const nonces: Record<string, string> = {};

export function generateNonce(address: string): string {
  const nonce = uuid();
  nonces[address] = nonce;
  return nonce;
}

export function authenticate(address: string, signature: string): { token: string } {
  const nonce = nonces[address];
  if (!nonce) throw new Error("Nonce not found");
  if (!verifySignature(address, signature, nonce)) throw new Error("Invalid signature");
  delete nonces[address];
  const token = jwt.sign({ address }, config.jwtSecret, { expiresIn: "1h" });
  return { token };
} 