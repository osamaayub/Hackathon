import { Controller, HttpCode, HttpStatus, NotFoundException, Param, Post, UseGuards, Inject } from '@nestjs/common';
import { SkipArcjet } from '../common/decorators/skip-arcjet.decorator.js';
import { CRON_JOBS, CronService, type CronJobName } from './cron.service.js';
import { CronSecretGuard } from './cron-secret.guard.js';

// Called by a scheduler, not a browser, so Arcjet's bot check is skipped. The secret is the protection.
@SkipArcjet()
@UseGuards(CronSecretGuard)
@Controller('cron')
export class CronController {
  constructor(@Inject(CronService) private readonly cron: CronService) {}

  @Post(':job')
  @HttpCode(HttpStatus.OK)
  async run(@Param('job') job: string) {
    if (!(CRON_JOBS as readonly string[]).includes(job)) {
      throw new NotFoundException(`Unknown job. Use one of: ${CRON_JOBS.join(', ')}`);
    }
    return this.cron.run(job as CronJobName);
  }
}
