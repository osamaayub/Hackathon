import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../lib/auth/auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async signUp(@Body() body: { email: string; password: string; name?: string }) {
    const auth = this.authService.instance;
    const bodyToSend: any = {
      email: body.email,
      password: body.password,
    };
    if (body.name) {
      bodyToSend.name = body.name;
    }

    const session = await auth.api.signUpEmail({
      body: bodyToSend,
    });

    return session;
  }

  @Post('sign-in')
  async signIn(@Body() body: { email: string; password: string }) {
    const auth = this.authService.instance;
    const session = await auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
      },
    });

    return session;
  }

  @Post('sign-out')
  async signOut(@Req() req: Request) {
    const auth = this.authService.instance;
    await auth.api.signOut({
      headers: req.headers as any,
    });

    return { success: true };
  }

  @Post('session')
  async getSession(@Req() req: Request) {
    const auth = this.authService.instance;
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    return session;
  }
}
