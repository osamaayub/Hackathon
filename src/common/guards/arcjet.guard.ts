import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ArcjetService } from '../../lib/arcjet/arcjet.service.js';

// Applied globally. Maps Arcjet denials to proper HTTP errors
// (the built-in ArcjetGuard returns a generic 403 for everything).
@Injectable()
export class ArcjetGuard implements CanActivate {
  constructor(private readonly arcjetService: ArcjetService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const request = context.switchToHttp().getRequest<Request>();
    const decision = await this.arcjetService.protect(request);

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
