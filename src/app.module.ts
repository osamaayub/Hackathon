import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetModule } from './lib/arcjet/arcjet.module.js';
import { ArcjetGuard } from './common/guards/arcjet.guard.js';
import { PrismaModule } from './lib/database/prisma.module.js';
import { MailModule } from './lib/mail/mail.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { HackathonModule } from './hackathon/hackathon.module.js';
import { TeamModule } from './team/team.module.js';
import { SubmissionModule } from './submission/submission.module.js';
import { TaskModule } from './task/task.module.js';
import { ScheduleModule } from './schedule/schedule.module.js';
import { ContactModule } from './contact/contact.module.js';
import { ScheduleModule as CronScheduleModule } from '@nestjs/schedule';
import { CacheModule } from './lib/cache/cache.module.js';
import { CommunityModule } from './community/community.module.js';
import { CronModule } from './cron/cron.module.js';

@Module({
  imports: [
    CronScheduleModule.forRoot(),
    ArcjetModule,
    PrismaModule,
    CacheModule,
    MailModule,
    AuthModule,
    UserModule,
    HackathonModule,
    TeamModule,
    SubmissionModule,
    TaskModule,
    ScheduleModule,
    ContactModule,
    CommunityModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ArcjetGuard }],
})
export class AppModule {}
