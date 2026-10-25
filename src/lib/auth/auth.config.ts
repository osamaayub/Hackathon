import { betterAuth } from 'better-auth';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { PrismaService } from '../database/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

// In production the frontend (e.g. a Vercel domain) and this backend (e.g. a Railway domain)
// are different sites, so the session cookie needs SameSite=None + Secure to survive a
// cross-site request. Locally both run on http://localhost, where the default (Lax, not
// Secure) already works fine and forcing Secure would break HTTP-only local dev.
const isProduction = process.env.NODE_ENV === 'production';

export const createBetterAuth = (prisma: PrismaService, mail: MailService) => {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.APP_BASE_URL || 'http://localhost:8080',
    // AuthController wraps each better-auth method under /auth/* by hand (no catch-all
    // mount), so basePath must match that prefix or links better-auth generates itself
    // (the verification email URL) would point at a route that doesn't exist.
    basePath: '/auth',
    trustedOrigins: [(process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '')],
    database: prismaAdapter(prisma.client, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await mail.sendVerificationEmail(user.email, url);
      },
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
      useSecureCookies: isProduction,
      defaultCookieAttributes: isProduction ? { sameSite: 'none', secure: true } : undefined,
      database: {
        joins: true,
      },
    },
  });
};
