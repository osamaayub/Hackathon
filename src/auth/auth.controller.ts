import { Controller, Get, Post, Body, Query, Req, Res, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { APIError } from 'better-auth';
import { AuthService } from '../lib/auth/auth.service.js';
import { sameSecret } from '../common/same-secret.js';
import { primaryFrontendUrl } from '../common/allowed-origins.js';
import { PrismaService } from '../lib/database/prisma.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { AdminSignUpDto } from './dto/admin-sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { RevokeSessionDto } from './dto/revoke-session.dto.js';
import { UnlinkAccountDto } from './dto/unlink-account.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

function toHttpException(error: unknown, fallbackMessage: string): HttpException {
  if (error instanceof APIError) {
    return new HttpException(
      { message: error.message || fallbackMessage, code: error.body?.code },
      error.statusCode,
    );
  }
  return new HttpException(
    error instanceof Error ? error.message : fallbackMessage,
    HttpStatus.BAD_REQUEST,
  );
}

// better-auth's `auth.api.*` calls set session cookies on an internal
// response context that is discarded unless `returnHeaders: true` is
// passed. Without forwarding `Set-Cookie` here, sign-up/sign-in/sign-out
// would return 200 but never actually persist a session in the browser.
function applySetCookies(res: Response, headers: Headers): void {
  for (const cookie of headers.getSetCookie()) {
    res.append('Set-Cookie', cookie);
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto, @Res({ passthrough: true }) res: Response) {
    return this.createAccount(body, res);
  }

  // Organizer accounts can only be created with the invite code in ORGANIZER_INVITE_CODE. Without that gate
  // anyone could make themselves an organizer, so the code is checked before anything else happens (which
  // also means a wrong code reveals nothing about which emails are registered).
  @Post('admin/sign-up')
  async adminSignUp(@Body() body: AdminSignUpDto, @Res({ passthrough: true }) res: Response) {
    const expected = process.env.ORGANIZER_INVITE_CODE?.trim();
    if (!expected) {
      throw new HttpException(
        { message: 'Organizer sign up is not enabled on this site.', code: 'ORGANIZER_SIGNUP_DISABLED' },
        HttpStatus.FORBIDDEN,
      );
    }
    if (!sameSecret(body.inviteCode.trim(), expected)) {
      throw new HttpException(
        { message: 'That invite code is not valid.', code: 'INVALID_INVITE_CODE' },
        HttpStatus.FORBIDDEN,
      );
    }

    const { inviteCode: _inviteCode, ...account } = body;
    const result = await this.createAccount(account, res);
    await this.prisma.client.user.update({
      where: { email: body.email.trim().toLowerCase() },
      data: { role: 'ADMIN' },
    });
    return result;
  }

  private async createAccount(body: SignUpDto, res: Response) {
    // With email verification required, Better Auth answers "success" for an email that already has
    // an account, without changing anything. That leaves people believing a new password was saved,
    // so say plainly that the account exists. (Trade off: this reveals which emails are registered.)
    const existing = await this.prisma.client.user.findUnique({
      where: { email: body.email.trim().toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      throw new HttpException(
        {
          message: 'An account with this email already exists. Sign in instead, or use "Forgot password" if you do not remember the password.',
          code: 'USER_ALREADY_EXISTS',
        },
        HttpStatus.CONFLICT,
      );
    }

    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password,
          name: body.name || '',
        },
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Sign up failed');
    }
  }

  // Participants and organizers (admins) sign in on separate pages. Each route checks the account's role
  // after the password is verified, so a participant can not use the organizer page and the other way round.
  @Post('sign-in')
  async signIn(@Body() body: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.signInAs(body, res, 'PARTICIPANT');
  }

  @Post('admin/sign-in')
  async adminSignIn(@Body() body: SignInDto, @Res({ passthrough: true }) res: Response) {
    return this.signInAs(body, res, 'ADMIN');
  }

  private async signInAs(body: SignInDto, res: Response, portal: 'PARTICIPANT' | 'ADMIN') {
    const { headers, response } = await this.authService.instance.api
      .signInEmail({
        body: { email: body.email, password: body.password },
        returnHeaders: true,
      })
      .catch((error: unknown) => {
        throw toHttpException(error, 'Sign in failed');
      });

    const isAdmin = response.user.role === 'ADMIN';

    if (portal === 'ADMIN' ? !isAdmin : isAdmin) {
      // The password was right, but this account belongs on the other page. Discard the session that was
      // just created so nothing stays signed in, and do not forward its cookie.
      if (response.token) {
        await this.prisma.client.session.deleteMany({ where: { token: response.token } });
      }
      throw new HttpException(
        {
          message: isAdmin
            ? 'This is an organizer account. Please sign in on the organizer page.'
            : 'This account is not an organizer account. Please sign in on the participant page.',
          code: 'WRONG_PORTAL',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    applySetCookies(res, headers);
    return response;
  }

  @Post('sign-out')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const auth = this.authService.instance;
      const { headers } = await auth.api.signOut({
        headers: req.headers as HeadersInit,
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return { success: true };
    } catch (error) {
      throw toHttpException(error, 'Sign out failed');
    }
  }

  @Post('session')
  async getSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.getSession({
        headers: req.headers as HeadersInit,
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Get session failed');
    }
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.verifyEmail({
        query: { token },
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Email verification failed');
    }
  }

  // Always answers success, whether or not the email has an account, so it cannot be used to find out
  // which addresses are registered.
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    try {
      const frontend = primaryFrontendUrl();
      await this.authService.instance.api.requestPasswordReset({
        body: { email: body.email, redirectTo: `${frontend}/reset-password` },
      });
      return { success: true };
    } catch (error) {
      throw toHttpException(error, 'Could not start the password reset');
    }
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      await this.authService.instance.api.resetPassword({
        body: { token: body.token, newPassword: body.newPassword },
      });
      return { success: true };
    } catch (error) {
      throw toHttpException(error, 'This reset link is invalid or has expired');
    }
  }

  @Post('send-verification-email')
  async sendVerificationEmail(@Body() body: ResendVerificationDto) {
    try {
      const auth = this.authService.instance;
      await auth.api.sendVerificationEmail({
        body: { email: body.email },
      });

      return { success: true };
    } catch (error) {
      throw toHttpException(error, 'Failed to send verification email');
    }
  }

  @Get('sessions')
  async listSessions(@Req() req: Request) {
    try {
      const auth = this.authService.instance;
      const sessions = await auth.api.listSessions({
        headers: req.headers as HeadersInit,
      });

      return sessions;
    } catch (error) {
      throw toHttpException(error, 'List sessions failed');
    }
  }

  @Post('session/revoke')
  async revokeSession(
    @Req() req: Request,
    @Body() body: RevokeSessionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.revokeSession({
        headers: req.headers as HeadersInit,
        body: { token: body.token },
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Revoke session failed');
    }
  }

  @Post('session/revoke-all')
  async revokeAllSessions(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.revokeSessions({
        headers: req.headers as HeadersInit,
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Revoke all sessions failed');
    }
  }

  @Post('session/revoke-others')
  async revokeOtherSessions(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.revokeOtherSessions({
        headers: req.headers as HeadersInit,
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Revoke other sessions failed');
    }
  }

  @Get('accounts')
  async listAccounts(@Req() req: Request) {
    try {
      const auth = this.authService.instance;
      const accounts = await auth.api.listUserAccounts({
        headers: req.headers as HeadersInit,
      });

      return accounts;
    } catch (error) {
      throw toHttpException(error, 'List accounts failed');
    }
  }

  @Post('account/unlink')
  async unlinkAccount(
    @Req() req: Request,
    @Body() body: UnlinkAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.unlinkAccount({
        headers: req.headers as HeadersInit,
        body: { accountId: body.accountId },
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Unlink account failed');
    }
  }
}
