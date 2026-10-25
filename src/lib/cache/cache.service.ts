import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

/**
 * Key value cache with a TTL. Uses Redis when REDIS_URL is set and falls back to process memory otherwise.
 * It is deliberately forgiving: a Redis error is logged and that call is served from memory, so a cache
 * outage can slow things down but never break a request.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly prefix = process.env.CACHE_PREFIX ?? 'hackathon:';
  private lastRedisError = 0;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  /** Which backend is serving the cache, for health checks and logs. */
  get backend(): 'redis' | 'memory' {
    return this.redis ? 'redis' : 'memory';
  }

  /** Checks the real connection, so a health check can tell "Redis is configured" from "Redis is working". */
  async status(): Promise<'redis' | 'redis-unreachable' | 'memory'> {
    if (!this.redis) return 'memory';
    if (!(await this.ensureReady())) return 'redis-unreachable';
    try {
      return (await this.redis.ping()) === 'PONG' ? 'redis' : 'redis-unreachable';
    } catch {
      return 'redis-unreachable';
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.read(this.prefix + key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.write(this.prefix + key, JSON.stringify(value), ttlSeconds);
  }

  async del(...keys: string[]): Promise<void> {
    const full = keys.map((k) => this.prefix + k);
    for (const k of full) this.memory.delete(k);
    if (!this.redis || full.length === 0 || !(await this.ensureReady())) return;
    try {
      await this.redis.del(...full);
    } catch (error) {
      this.noteRedisError(error);
    }
  }

  /**
   * Returns the cached value, or runs `loader`, caches its result and returns it. Concurrent calls for the
   * same key share one load, so a burst of requests after expiry does not hit the database many times.
   */
  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const running = this.inFlight.get(key) as Promise<T> | undefined;
    if (running) return running;

    const load = (async () => {
      try {
        const value = await loader();
        await this.set(key, value, ttlSeconds);
        return value;
      } finally {
        this.inFlight.delete(key);
      }
    })();
    this.inFlight.set(key, load);
    return load;
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }

  private async read(key: string): Promise<string | null> {
    if (this.redis && (await this.ensureReady())) {
      try {
        return await this.redis.get(key);
      } catch (error) {
        this.noteRedisError(error);
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  private async write(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis && (await this.ensureReady())) {
      try {
        await this.redis.set(key, value, 'EX', Math.max(1, Math.floor(ttlSeconds)));
        return;
      } catch (error) {
        this.noteRedisError(error);
      }
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.trimMemory();
  }

  /**
   * True once the Redis connection is usable. A freshly started (for example serverless) instance sends its
   * first command before the connection has finished opening, and the client is set to fail fast rather than
   * queue, so wait briefly for it. If it is down, or does not open in time, callers use the memory cache.
   */
  private async ensureReady(): Promise<boolean> {
    const redis = this.redis;
    if (!redis) return false;
    const status = (redis as { status?: string }).status;
    if (!status || status === 'ready') return true;
    if (status !== 'connecting' && status !== 'connect' && status !== 'wait') return false; // reconnecting or ended

    return new Promise<boolean>((resolve) => {
      const finish = (ok: boolean) => {
        clearTimeout(timer);
        redis.off('ready', onReady);
        redis.off('end', onEnd);
        resolve(ok);
      };
      const onReady = () => finish(true);
      const onEnd = () => finish(false);
      const timer = setTimeout(() => finish(false), 2_500);
      redis.once('ready', onReady);
      redis.once('end', onEnd);
    });
  }

  /** Keeps the fallback cache from growing without bound. */
  private trimMemory() {
    if (this.memory.size < 500) return;
    const now = Date.now();
    for (const [k, v] of this.memory) if (v.expiresAt <= now) this.memory.delete(k);
    if (this.memory.size >= 500) this.memory.delete(this.memory.keys().next().value as string);
  }

  /** Logs at most once a minute, so a Redis outage does not flood the logs. */
  private noteRedisError(error: unknown) {
    const now = Date.now();
    if (now - this.lastRedisError < 60_000) return;
    this.lastRedisError = now;
    this.logger.warn(`Redis error, serving from memory instead: ${error instanceof Error ? error.message : String(error)}`);
  }
}
