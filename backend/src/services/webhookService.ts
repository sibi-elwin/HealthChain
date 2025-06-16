// backend/src/services/webhookService.ts

import axios from 'axios';
import { prisma } from '../lib/prisma';

interface NotificationData {
  to: string;
  from: {
    name: string;
    role: 'doctor' | 'patient';
    specialization?: string;
    registrationNumber?: string;
    hospital?: string;
  };
  type: 'ACCESS_REQUEST' | 'ACCESS_GRANTED' | 'ACCESS_REJECTED';
  message: string;
  metadata?: Record<string, any>;
}

export class WebhookService {
  private static readonly N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  private static readonly TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

  private static async checkNotificationPreferences(userId: string, role: 'doctor' | 'patient'): Promise<boolean> {
    if (role === 'patient') {
      const patient = await prisma.patient.findUnique({
        where: { userId }
      });
      return patient?.enableWhatsAppNotifications ?? false;
    } else {
      const doctor = await prisma.user.findUnique({
        where: { id: userId },
        include: { doctorProfile: true }
      });
      return doctor?.doctorProfile?.enableWhatsAppNotifications ?? false;
    }
  }

  private static formatMessage(data: NotificationData): string {
    const timestamp = new Date().toLocaleString();
    const rolePrefix = data.from.role === 'doctor' ? 'Dr.' : '';
    const senderInfo = data.from.role === 'doctor' 
      ? `${rolePrefix} ${data.from.name} (${data.from.specialization}, Reg# ${data.from.registrationNumber})`
      : data.from.name;

    switch (data.type) {
      case 'ACCESS_REQUEST':
        return `🔔 Access Request Notification:\n\n${senderInfo} has requested access to view your medical records for consultation.\n\n🕒 Time: ${timestamp}\n\nPlease review the request in your portal.`;
      
      case 'ACCESS_GRANTED':
        return `✅ Access Granted Notification:\n\n${senderInfo} has granted you access to their medical records.\n\n🕒 Time: ${timestamp}\n\nYou can now view the records in your portal.`;
      
      case 'ACCESS_REJECTED':
        return `❌ Access Request Rejected:\n\n${senderInfo} has rejected your access request.\n\n🕒 Time: ${timestamp}`;
      
      default:
        return data.message;
    }
  }

  static async sendWhatsAppNotification(data: NotificationData) {
    if (!this.N8N_WEBHOOK_URL || !this.TWILIO_WHATSAPP_NUMBER) {
      console.error('Missing required environment variables for WhatsApp notification');
      return;
    }

    try {
      // Check notification preferences
      const user = await prisma.user.findFirst({
        where: { phoneNumber: data.to }
      });

      if (!user) {
        console.error('User not found for phone number:', data.to);
        return;
      }

      const notificationsEnabled = await this.checkNotificationPreferences(user.id, data.from.role === 'doctor' ? 'patient' : 'doctor');
      
      if (!notificationsEnabled) {
        console.log('WhatsApp notifications disabled for user');
        return;
      }

      const formattedMessage = this.formatMessage(data);

      await axios.post(this.N8N_WEBHOOK_URL, {
        from: this.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${data.to}`,
        message: formattedMessage,
        metadata: {
          ...data.metadata,
          type: data.type,
          from: data.from,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }
}