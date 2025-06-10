// backend/src/services/webhookService.ts

import axios from 'axios';

export class WebhookService {
  private static readonly N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  private static readonly TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

  static async sendWhatsAppNotification(data: {
    to: string;
    doctor: {
      name: string;
      specialization: string;
      registrationNumber: string;
      hospital: string;
    };
    patientEmail: string;
  }) {
    if (!this.N8N_WEBHOOK_URL || !this.TWILIO_WHATSAPP_NUMBER) {
      console.error('Missing required environment variables for WhatsApp notification');
      return;
    }

    try {
      await axios.post(this.N8N_WEBHOOK_URL, {
        from: this.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${data.to}`,
        message: `🔔 Access Request Notification:\n\nDr. ${data.doctor.name} (${data.doctor.specialization}, Reg# ${data.doctor.registrationNumber}) has requested access to view your medical records for consultation.\n\n🕒 Time: ${new Date().toLocaleString()}\n\nPlease approve the request via your patient portal.`,
        doctor: data.doctor,
        patientEmail: data.patientEmail
      });
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }
}