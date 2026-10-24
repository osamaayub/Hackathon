import { Controller, Get, Post, Body, Req, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../lib/auth/auth.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { RevokeSessionDto } from './dto/revoke-session.dto.js';
import { UnlinkAccountDto } from './dto/unlink-account.dto.js';

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
      throw new BadRequestException(error instanceof Error ? error.message : 'Sign up failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Sign in failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Sign out failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Get session failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'List sessions failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Revoke session failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Revoke all sessions failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Revoke other sessions failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'List accounts failed');
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
      throw new BadRequestException(error instanceof Error ? error.message : 'Unlink account failed');
    }
  }
}
