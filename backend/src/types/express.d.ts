import { User, Session } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
    }
  }
}

// This export is needed to make the file a module
export {}; 