import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthService } from '../../lib/auth/auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const auth = this.authService.instance;

    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    request.user = session.user;
    request.session = session;
    return true;
  }
}
