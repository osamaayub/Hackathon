import { Global, Logger, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheService, REDIS_CLIENT } from './cache.service.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        const logger = new Logger('Cache');
        // Vercel's Redis integration names its connection string KV_URL, so accept that as well.
        const url = (process.env.REDIS_URL || process.env.KV_URL)?.trim();
        if (!url) {
          logger.log('REDIS_URL is not set; caching in process memory.');
          return null;
        }

        const client = new Redis(url, {
          // Fail fast instead of queueing: a slow or unreachable Redis must not make requests wait.
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 3_000,
          commandTimeout: 1_500,
          lazyConnect: false,
        });
        client.on('error', () => undefined); // errors surface per call and are handled in CacheService
        logger.log('Caching in Redis.');
        return client;
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
