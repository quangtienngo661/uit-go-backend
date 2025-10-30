import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendPushNotification(token: string, title: string, body: string) {
    this.logger.log(`📱 Simulating push notification: ${title} - ${body}`);
  }

  async sendEmailNotification(email: string, subject: string, message: string) {
    try {
      const mailOptions = {
        from: `"UIT-Go Notifications" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        text: message,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${email}`, error);
    }
  }
}
