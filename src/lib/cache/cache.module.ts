import { Global, Logger, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CacheService, REDIS_CLIENT } from './cache.service.js';
import { parseRedisUrl } from './redis-url.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        const logger = new Logger('Cache');
        // Vercel's Redis integration names its connection string KV_URL, so accept that as well.
        const parsed = parseRedisUrl(process.env.REDIS_URL || process.env.KV_URL);
        if ('reason' in parsed) {
          // A bad or missing setting must never stop the app from starting: cache in memory instead.
          if (parsed.reason === 'not set') {
            logger.log('REDIS_URL is not set; caching in process memory.');
          } else {
            logger.warn(`REDIS_URL is set but cannot be used (${parsed.reason}). Caching in process memory instead.`);
          }
          return null;
        }

        try {
          const client = new Redis(parsed.url, {
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
        } catch (error) {
          logger.warn(`Could not start the Redis client (${error instanceof Error ? error.message : 'unknown error'}). Caching in process memory instead.`);
          return null;
        }
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
