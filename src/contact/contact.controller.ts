import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { CreateContactMessageDto } from './dto/create-contact-message.dto.js';

// Public on purpose: visitors without an account can reach us. The global
// ArcjetGuard still applies its rate limits and bot checks to this route.
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  send(@Body() body: CreateContactMessageDto) {
    return this.contactService.send(body);
  }
}
