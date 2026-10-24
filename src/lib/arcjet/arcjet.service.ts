import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ARCJET,
  type ArcjetDecision,
  type ArcjetNest,
  type ArcjetNestRequest,
} from '@arcjet/nest';

@Injectable()
export class ArcjetService {
  private readonly logger = new Logger(ArcjetService.name);

  constructor(@Inject(ARCJET) private readonly arcjet: ArcjetNest) {}

  // Runs the global rules against a request. `requested` = tokens to consume.
  async protect(
    request: ArcjetNestRequest,
    requested = 1,
  ): Promise<ArcjetDecision> {
    const decision = await this.arcjet.protect(request, { requested });

    if (decision.isErrored()) {
      // Fail open: an Arcjet outage should not take the API down.
      this.logger.warn(`Arcjet error: ${decision.reason.message}`);
    } else if (decision.isDenied()) {
      this.logger.log(`Denied (${decision.reason.type}) id=${decision.id}`);
    }

    return decision;
  }
}
