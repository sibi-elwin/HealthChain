import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import prisma from '../lib/prisma'; 
export interface AuthRequest extends Request {
  address?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Unauthorized" });
  const token = authHeader.split(" ")[1];
  try {
    const payload: any = jwt.verify(token, config.jwtSecret);
    req.address = payload.address;
    // Fetch user by wallet address
    const user = await prisma.user.findUnique({ where: { walletAddress: payload.address } });
    if (!user) return res.status(401).json({ error: "User not found" });
    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
} 
