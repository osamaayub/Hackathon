import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { createBetterAuth } from './auth.config.js';

@Injectable()
export class AuthService implements OnModuleInit {
  private auth: ReturnType<typeof createBetterAuth>;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.auth = createBetterAuth(this.prisma);
  }

  get instance() {
    if (!this.auth) {
      throw new Error('AuthService not initialized. Ensure onModuleInit has completed.');
    }
    return this.auth;
  }
}
