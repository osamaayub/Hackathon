import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../lib/auth/auth.service.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';

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
}
