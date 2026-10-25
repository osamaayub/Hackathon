import { Controller, Get, Post, Body, Query, Req, Res, HttpException, HttpStatus, Inject } from '@nestjs/common';
import type { Request, Response } from 'express';
import { APIError } from 'better-auth';
import { AuthService } from '../lib/auth/auth.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { RevokeSessionDto } from './dto/revoke-session.dto.js';
import { UnlinkAccountDto } from './dto/unlink-account.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';

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
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto, @Res({ passthrough: true }) res: Response) {
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

  @Post('sign-in')
  async signIn(@Body() body: SignInDto, @Res({ passthrough: true }) res: Response) {
    try {
      const auth = this.authService.instance;
      const { headers, response } = await auth.api.signInEmail({
        body: {
          email: body.email,
          password: body.password,
        },
        returnHeaders: true,
      });

      applySetCookies(res, headers);
      return response;
    } catch (error) {
      throw toHttpException(error, 'Sign in failed');
    }
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
