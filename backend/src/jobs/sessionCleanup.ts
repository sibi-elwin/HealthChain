import { SessionService } from '../services/sessionService';

const sessionService = new SessionService();

export async function cleanupSessions() {
  try {
    console.log('Starting session cleanup job...');
    await sessionService.cleanupExpiredSessions();
    console.log('Session cleanup completed successfully');
  } catch (error) {
    console.error('Error during session cleanup:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupSessions, 60 * 60 * 1000);

// Run initial cleanup
cleanupSessions(); 