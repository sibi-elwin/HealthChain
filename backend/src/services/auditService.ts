import { PrismaClient, AuditLog, Session } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export class AuditService {
  async createAuditLog(
    userId: string,
    action: string,
    details?: string,
    req?: Request
  ): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    });
  }

  async createSession(
    userId: string,
    token: string,
    expiresIn: number = 24 * 60 * 60, // 24 hours in seconds
    req?: Request
  ): Promise<Session> {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    
    return prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      },
    });
  }

  async validateSession(token: string): Promise<Session | null> {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      return null;
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return session;
  }

  async invalidateSession(token: string): Promise<void> {
    await prisma.session.update({
      where: { token },
      data: { isValid: false },
    });
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return prisma.session.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isValid: false },
        ],
      },
    });
  }
}

export const auditService = new AuditService(); 