import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../lib/database/prisma.service.js';
import { CommunityService } from '../community/community.service.js';

export const CRON_JOBS = ['warm-cache', 'cleanup'] as const;
export type CronJobName = (typeof CRON_JOBS)[number];

/**
 * Background jobs. On a normal server the @Cron schedules below run in process. A serverless host such as
 * Vercel cannot keep timers alive, so the same jobs are also reachable through POST /cron/:job, which an
 * external scheduler (see .github/workflows/scheduled-jobs.yml) calls instead.
 */
@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CommunityService) private readonly community: CommunityService,
  ) {}

  @Cron('*/5 * * * *', { name: 'warm-cache', waitForCompletion: true })
  async scheduledWarmCache() {
    if (this.inProcessCronDisabled()) return;
    await this.run('warm-cache');
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'cleanup', waitForCompletion: true })
  async scheduledCleanup() {
    if (this.inProcessCronDisabled()) return;
    await this.run('cleanup');
  }

  async run(job: CronJobName) {
    const started = Date.now();
    try {
      const result = job === 'warm-cache' ? await this.community.refresh() : await this.cleanup();
      this.logger.log(`Job "${job}" finished in ${Date.now() - started}ms: ${JSON.stringify(result)}`);
      return { job, ms: Date.now() - started, ...result };
    } catch (error) {
      this.logger.error(`Job "${job}" failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /** Removes expired sessions and one time tokens so those tables stay small and fast. */
  private async cleanup() {
    const now = new Date();
    const [sessions, tokens] = await Promise.all([
      this.prisma.client.session.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.client.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);
    return { expiredSessionsRemoved: sessions.count, expiredTokensRemoved: tokens.count };
  }

  private inProcessCronDisabled() {
    return Boolean(process.env.VERCEL) || process.env.DISABLE_CRON === '1';
  }
}
