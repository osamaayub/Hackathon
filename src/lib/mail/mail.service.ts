import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set; verification emails will be logged to the console instead of sent.',
      );
    }
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[dev stub] Verification email for ${to}: ${verificationUrl}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Verify your email',
      html: `<p>Click the link below to verify your email address:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });
  }
}
