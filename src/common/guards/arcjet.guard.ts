import { CanActivate, ExecutionContext, ForbiddenException, HttpException, HttpStatus, Injectable, Logger, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { SKIP_ARCJET_KEY } from '../decorators/skip-arcjet.decorator.js';
import { ArcjetService } from '../../lib/arcjet/arcjet.service.js';

// Applied globally. Maps Arcjet denials to proper HTTP errors
// (the built-in ArcjetGuard returns a generic 403 for everything).
@Injectable()
export class ArcjetGuard implements CanActivate {
  private readonly logger = new Logger(ArcjetGuard.name);

  constructor(
    @Inject(ArcjetService) private readonly arcjetService: ArcjetService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ARCJET_KEY, [context.getHandler(), context.getClass()]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();
    // Fail open if Arcjet does not answer in time, so its outage cannot hang the whole API.
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), 5_000);
    });
    const decision = await Promise.race([this.arcjetService.protect(request), timeout]).finally(() => clearTimeout(timer));
    if (decision === null) {
      this.logger.warn('Arcjet did not answer within 5s; allowing the request.');
      return true;
    }

    if (!decision.isDenied()) return true;

    if (decision.reason.isRateLimit()) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (decision.reason.isBot()) {
      throw new ForbiddenException('Bots are not allowed');
    }
    throw new ForbiddenException('Forbidden');
  }
}
