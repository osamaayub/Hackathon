import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly overrideTo: string | null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    // Resend's shared onboarding sender only delivers to the account owner's own
    // address, so MAIL_OVERRIDE_TO redirects every email to that personal inbox.
    this.overrideTo = process.env.MAIL_OVERRIDE_TO?.trim() || null;

    if (!this.resend) {
      this.logger.warn(
        'RESEND_API_KEY is not set; verification emails will be logged to the console instead of sent.',
      );
    }
  }

  async sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
    await this.deliver(
      to,
      'Verify your email',
      `<p>Click the link below to verify your email address:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
      `Verification email for ${to}: ${verificationUrl}`,
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.deliver(
      to,
      'Reset your password',
      `<p>We received a request to reset your password. Click the link below to choose a new one. The link works for one hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p style="color:#888;font-size:12px">If you did not ask for this, you can ignore this email.</p>`,
      `Password reset email for ${to}: ${resetUrl}`,
    );
  }

  /** Sends a transactional email, honouring MAIL_OVERRIDE_TO. Failures are logged, not thrown. */
  private async deliver(to: string, subject: string, html: string, devStubMessage: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[dev stub] ${devStubMessage}`);
      return;
    }

    const recipient = this.overrideTo ?? to;
    const note = this.overrideTo
      ? `<p style="color:#888;font-size:12px">Originally addressed to ${to}.</p>`
      : '';

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: recipient,
      subject,
      html: html + note,
    });

    if (error) {
      this.logger.error(`Resend failed to send "${subject}" to ${recipient}: ${error.message}`);
    }
  }

  /**
   * Forwards a contact form message to the team inbox (CONTACT_TO_EMAIL, falling back to
   * MAIL_OVERRIDE_TO). Without an API key the message is logged so local development still works.
   */
  async sendContactMessage(msg: { name: string; email: string; topic: string; message: string }): Promise<void> {
    const to = process.env.CONTACT_TO_EMAIL?.trim() || this.overrideTo;

    if (!this.resend) {
      this.logger.log(`[dev stub] Contact message from ${msg.name} <${msg.email}> (${msg.topic}): ${msg.message}`);
      return;
    }
    if (!to) {
      this.logger.error('Contact message received but neither CONTACT_TO_EMAIL nor MAIL_OVERRIDE_TO is set.');
      throw new ServiceUnavailableException('Messages cannot be delivered right now. Please try again later.');
    }

    const esc = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to,
      replyTo: msg.email,
      subject: `[Contact: ${msg.topic}] ${msg.name}`,
      html: `<p><strong>${esc(msg.name)}</strong> &lt;${esc(msg.email)}&gt; wrote about <em>${esc(msg.topic)}</em>:</p><p style="white-space:pre-wrap">${esc(msg.message)}</p>`,
    });

    if (error) {
      this.logger.error(`Resend failed to deliver a contact message: ${error.message}`);
      throw new ServiceUnavailableException('Messages cannot be delivered right now. Please try again later.');
    }
  }
}
