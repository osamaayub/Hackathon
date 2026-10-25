import { betterAuth } from 'better-auth';
import { allowedOrigins, primaryFrontendUrl } from '../../common/allowed-origins.js';
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
    trustedOrigins: allowedOrigins(),
    database: prismaAdapter(prisma.client, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 60 * 60, // one hour
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        // The link goes straight to the frontend page, which posts the token back to /auth/reset-password.
        const frontend = primaryFrontendUrl();
        await mail.sendPasswordResetEmail(user.email, `${frontend}/reset-password?token=${encodeURIComponent(token)}`);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, token }) => {
        // Link to the frontend page, which calls GET /auth/verify-email with the token and then
        // signs the user in. (Better Auth's own `url` would open raw JSON from the API.)
        const frontend = primaryFrontendUrl();
        await mail.sendVerificationEmail(user.email, `${frontend}/verify-email?token=${encodeURIComponent(token)}`);
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
