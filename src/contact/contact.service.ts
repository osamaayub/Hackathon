import { Injectable } from '@nestjs/common';
import { MailService } from '../lib/mail/mail.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';

@Injectable()
export class ContactService {
  constructor(private readonly mail: MailService) {}

  // Delivery goes through MailService, which needs CONTACT_TO_EMAIL (or MAIL_OVERRIDE_TO) in .env.
  // With Resend's free test sender that address must be the Resend account owner's email.
  async send(dto: CreateContactMessageDto) {
    await this.mail.sendContactMessage(dto);
    return { success: true };
  }
}
