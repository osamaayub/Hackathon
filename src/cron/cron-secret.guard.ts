import { CanActivate, ExecutionContext, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Request } from 'express';
import { sameSecret } from '../common/same-secret.js';

/** Lets a request through only when it carries `Authorization: Bearer <CRON_SECRET>`. */
@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.CRON_SECRET?.trim();
    if (!expected) {
      throw new ServiceUnavailableException('Scheduled jobs are not configured. Set CRON_SECRET.');
    }

    const header = context.switchToHttp().getRequest<Request>().headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token || !sameSecret(token, expected)) {
      throw new ForbiddenException('Invalid cron secret');
    }
    return true;
  }
}
