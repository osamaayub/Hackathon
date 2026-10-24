import { Controller, Get, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { APIError } from 'better-auth';
import { AuthService } from '../lib/auth/auth.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { RevokeSessionDto } from './dto/revoke-session.dto.js';
import { UnlinkAccountDto } from './dto/unlink-account.dto.js';

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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() body: SignUpDto) {
    try {
      const auth = this.authService.instance;
      const session = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password,
          name: body.name || '',
        },
      });

      return session;
    } catch (error) {
      throw toHttpException(error, 'Sign up failed');
    }
  }

  @Post('sign-in')
  async signIn(@Body() body: SignInDto) {
    try {
      const auth = this.authService.instance;
      const session = await auth.api.signInEmail({
        body: {
          email: body.email,
          password: body.password,
        },
      });

      return session;
    } catch (error) {
      throw toHttpException(error, 'Sign in failed');
    }
  }

  @Post('sign-out')
  async signOut(@Req() req: Request) {
    try {
      const auth = this.authService.instance;
      await auth.api.signOut({
        headers: req.headers as HeadersInit,
      });

      return { success: true };
    } catch (error) {
      throw toHttpException(error, 'Sign out failed');
    }
  }

  @Post('session')
  async getSession(@Req() req: Request) {
    try {
      const auth = this.authService.instance;
      const session = await auth.api.getSession({
        headers: req.headers as HeadersInit,
      });

      return session;
    } catch (error) {
      throw toHttpException(error, 'Get session failed');
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
  async revokeSession(@Req() req: Request, @Body() body: RevokeSessionDto) {
    try {
      const auth = this.authService.instance;
      const result = await auth.api.revokeSession({
        headers: req.headers as HeadersInit,
        body: { token: body.token },
      });

      return result;
    } catch (error) {
      throw toHttpException(error, 'Revoke session failed');
    }
  }

  @Post('session/revoke-all')
  async revokeAllSessions(@Req() req: Request) {
    try {
      const auth = this.authService.instance;
      const result = await auth.api.revokeSessions({
        headers: req.headers as HeadersInit,
      });

      return result;
    } catch (error) {
      throw toHttpException(error, 'Revoke all sessions failed');
    }
  }

  @Post('session/revoke-others')
  async revokeOtherSessions(@Req() req: Request) {
    try {
      const auth = this.authService.instance;
      const result = await auth.api.revokeOtherSessions({
        headers: req.headers as HeadersInit,
      });

      return result;
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
  async unlinkAccount(@Req() req: Request, @Body() body: UnlinkAccountDto) {
    try {
      const auth = this.authService.instance;
      const result = await auth.api.unlinkAccount({
        headers: req.headers as HeadersInit,
        body: { accountId: body.accountId },
      });

      return result;
    } catch (error) {
      throw toHttpException(error, 'Unlink account failed');
    }
  }
}
