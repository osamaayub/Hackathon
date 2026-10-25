import { Global, Logger, Module } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { CacheService, REDIS_CLIENT } from './cache.service.js';
import { readRedisConfig } from './redis-config.js';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis | null => {
        const logger = new Logger('Cache');
        const config = readRedisConfig();

        if (config.url === null) {
          // A bad or missing setting must never stop the app from starting: cache in memory instead.
          if (config.reason === 'not set') {
            logger.log('Redis is not configured; caching in process memory.');
          } else {
            logger.warn(`Redis is configured but cannot be used (${config.reason}). Caching in process memory instead.`);
          }
          return null;
        }

        try {
          // Upstash is reached over HTTPS, so there is no connection to open or keep alive, which suits serverless
          // hosts. Values are stored as JSON strings by CacheService, so skip the client's own conversion.
          const client = new Redis({
            url: config.url,
            token: config.token,
            automaticDeserialization: false,
            retry: { retries: 1, backoff: () => 150 },
          });
          logger.log(`Caching in Upstash Redis (${new URL(config.url).host}).`);
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
