import { Module } from '@nestjs/common';
import { CommunityModule } from '../community/community.module.js';
import { CronController } from './cron.controller.js';
import { CronService } from './cron.service.js';
import { CronSecretGuard } from './cron-secret.guard.js';

@Module({
  imports: [CommunityModule],
  controllers: [CronController],
  providers: [CronService, CronSecretGuard],
})
export class CronModule {}
