import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async sendPushNotification(token: string, title: string, body: string) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
      });
      this.logger.log(`✅ Push notification sent to ${token}`);
    } catch (error) {
      this.logger.error('❌ Failed to send push notification', error);
    }
  }

  async sendEmailNotification(email: string, subject: string, message: string) {
    this.logger.log(`📧 Email to ${email}: ${subject} - ${message}`);
  }
}
