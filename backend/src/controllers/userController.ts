import { Request, Response } from "express";
import { generateNonce, authenticate } from "../services/authService";

export const userController = {
  requestNonce: (req: Request, res: Response) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: "Address required" });
    const nonce = generateNonce(address);
    res.json({ nonce });
  },
  verifySignature: (req: Request, res: Response) => {
    const { address, signature } = req.body;
    try {
      const { token } = authenticate(address, signature);
      res.json({ token });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
}; 