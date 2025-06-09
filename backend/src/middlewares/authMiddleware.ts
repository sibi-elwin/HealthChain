import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { SessionService } from '../services/sessionService';
import { PrismaClient, User, Role } from '@prisma/client';

const prisma = new PrismaClient();
const sessionService = new SessionService();

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  walletAddress: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      session?: any;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // First try to validate as an auth session
    const authSession = await sessionService.validateAuthSession(token);
    
    if (authSession) {
      // Auth session is valid, create a new regular session
      const user = await prisma.user.findUnique({
        where: { id: authSession.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          walletAddress: true
        }
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

      req.user = user as AuthenticatedUser;
      req.session = newSession;
      return next();
    }

    // If no valid auth session found, try to validate as a regular session
    const session = await sessionService.validateSession(token);
    
    if (session) {
      // Regular session is valid
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          walletAddress: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user as AuthenticatedUser;
      req.session = session;
      return next();
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireRole(roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
} 
