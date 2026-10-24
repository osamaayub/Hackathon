import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

// Runs after AuthGuard (which populates request.user); apply both, in that order:
// @UseGuards(AuthGuard, AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
