import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { SessionService } from '../services/sessionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const sessionService = new SessionService();

export interface AuthRequest extends Request {
  address?: string;
  userId?: string;
  session?: any;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // First try to validate as a regular session
    const session = await sessionService.validateSession(token);
    
    if (session) {
      // Regular session is valid
      req.userId = session.userId;
      req.session = session;
      return next();
    }

    // If no valid session found, try to validate as an auth session
    const authSession = await sessionService.validateAuthSession(token);
    
    if (authSession) {
      // Auth session is valid, create a new regular session
      const user = await prisma.user.findUnique({
        where: { id: authSession.userId },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Create a new regular session
      const newSession = await sessionService.createSession(
        user.id,
        token,
        24 * 60 * 60, // 24 hours
        req
      );

      req.userId = user.id;
      req.session = newSession;
      return next();
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireRole(roles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
} 
