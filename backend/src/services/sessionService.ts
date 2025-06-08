import { PrismaClient, Session, AuthSession } from '@prisma/client';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class SessionService {
  // Create a new authentication session (used during login)
  async createAuthSession(
    userId: string,
    token: string,
    expiresIn: number = 24 * 60 * 60 // 24 hours in seconds
  ): Promise<AuthSession> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    return prisma.authSession.create({
      data: {
        id: uuidv4(),
        userId,
        token,
        expiresAt,
      },
    });
  }

  // Create a new regular session (used after successful authentication)
  async createSession(
    userId: string,
    token: string,
    expiresIn: number = 24 * 60 * 60, // 24 hours in seconds
    req?: Request
  ): Promise<Session> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    return prisma.session.create({
      data: {
        id: uuidv4(),
        userId,
        token,
        expiresAt,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    });
  }

  // Validate an authentication session
  async validateAuthSession(token: string): Promise<AuthSession | null> {
    const session = await prisma.authSession.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  // Validate a regular session
  async validateSession(token: string): Promise<Session | null> {
    const session = await prisma.session.findFirst({
      where: {
        token,
        isValid: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (session) {
      // Update last activity
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      });
    }

    return session;
  }

  // Invalidate a session (logout)
  async invalidateSession(token: string): Promise<void> {
    await prisma.session.updateMany({
      where: { token },
      data: { isValid: false },
    });
  }

  // Get all active sessions for a user
  async getUserSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastActivity: 'desc',
      },
    });
  }

  // Cleanup expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isValid: false },
        ],
      },
    });

    await prisma.authSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  // Delete all sessions for a user (force logout from all devices)
  async deleteAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
} 