import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { PrismaService } from '../database/prisma.service.js';

export const createBetterAuth = (prisma: PrismaService) => {
  return betterAuth({
    baseURL: process.env.APP_BASE_URL || 'http://localhost:3000',
    database: prismaAdapter(prisma.client, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    user: {
      additionalFields: {
        // Server-owned: always PARTICIPANT on sign-up, never accepted from
        // the client. Admins are provisioned out of band (prisma/seed.ts).
        role: {
          type: 'string',
          required: true,
          defaultValue: 'PARTICIPANT',
          input: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
      useSecureCookies: false,
      database: {
        joins: true,
      },
    },
  });
};
