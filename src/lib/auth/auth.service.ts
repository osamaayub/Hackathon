import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import { createBetterAuth } from './auth.config.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private auth: ReturnType<typeof createBetterAuth>;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MailService) private readonly mail: MailService,
  ) {}

  async onModuleInit() {
    this.auth = createBetterAuth(this.prisma, this.mail);
  }

  get instance() {
    if (!this.auth) {
      throw new Error('AuthService not initialized. Ensure onModuleInit has completed.');
    }
    return this.auth;
  }
}
