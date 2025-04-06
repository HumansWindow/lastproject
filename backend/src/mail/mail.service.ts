import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  async sendEmailVerification(email: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    // TODO: Implement actual email sending logic with a library like nodemailer
    console.log(`[EMAIL VERIFICATION] To: ${email}, Name: ${name}, URL: ${verificationUrl}`);
  }

  async sendPasswordReset(email: string, name: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    // TODO: Implement actual email sending logic with a library like nodemailer
    console.log(`[PASSWORD RESET] To: ${email}, Name: ${name}, URL: ${resetUrl}`);
  }

  /**
   * Send welcome email to user after email verification
   * @param email User's email address
   * @param name User's name or username
   * @returns Promise<void>
   */
  async sendWelcome(email: string, name: string): Promise<void> {
    const loginUrl = `${this.configService.get('FRONTEND_URL')}/login`;

    // TODO: Implement actual email sending logic with a library like nodemailer
    console.log(`[WELCOME EMAIL] To: ${email}, Name: ${name}, LoginURL: ${loginUrl}`);
  }
}
