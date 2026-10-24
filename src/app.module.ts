import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ArcjetModule } from './lib/arcjet/arcjet.module.js';
import { ArcjetGuard } from './common/guards/arcjet.guard.js';
import { PrismaModule } from './lib/database/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { HackathonModule } from './hackathon/hackathon.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule({
  // The Arcjet client is a frozen object; Observe's proxy breaks its
  // read-only `protect` method (TypeError -> HTTP 500 on every request).
  skipInstrumentation: (instance) =>
    typeof instance === 'object' &&
    instance !== null &&
    Object.isFrozen(instance),
});

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // Credentials are read in the factory so they resolve after main.ts
    // has loaded .env (a plain forRoot() would read them at import time).
    ObserveModule.forRootAsync({
      useFactory: () => ({
        appKey: process.env.OBSERVE_APP_KEY ?? '',
        appSecret: process.env.OBSERVE_APP_SECRET ?? '',
        serviceId: 'Hackathon',
      }),
    }),
    ArcjetModule,
    PrismaModule,
    AuthModule,
    UserModule,
    HackathonModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ArcjetGuard }],
})
export class AppModule {}
