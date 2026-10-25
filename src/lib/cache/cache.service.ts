import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Redis } from '@upstash/redis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/** How long to wait for Redis before giving up on one call and using memory instead. */
const REDIS_TIMEOUT_MS = 1_500;

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

/**
 * Key value cache with a TTL. Uses Upstash Redis (over HTTPS) when it is configured and falls back to process
 * memory otherwise. It is deliberately forgiving: a Redis error or a slow answer is logged and that call is
 * served from memory, so a cache outage can slow things down but never break a request.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly prefix = process.env.CACHE_PREFIX ?? 'hackathon:';
  private lastRedisError = 0;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  /** Which backend is configured, for logs. */
  get backend(): 'redis' | 'memory' {
    return this.redis ? 'redis' : 'memory';
  }

  /** Checks the real connection, so a health check can tell "Redis is configured" from "Redis is working". */
  async status(): Promise<'redis' | 'redis-unreachable' | 'memory'> {
    if (!this.redis) return 'memory';
    try {
      return (await this.withTimeout(this.redis.ping())) === 'PONG' ? 'redis' : 'redis-unreachable';
    } catch (error) {
      this.noteRedisError(error);
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
    if (!this.redis || full.length === 0) return;
    try {
      await this.withTimeout(this.redis.del(...full));
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

  private async read(key: string): Promise<string | null> {
    if (this.redis) {
      try {
        const value = await this.withTimeout(this.redis.get<string>(key));
        if (value !== null && value !== undefined) return typeof value === 'string' ? value : JSON.stringify(value);
        return this.readMemory(key); // not in Redis: a value written during an outage may still be in memory
      } catch (error) {
        this.noteRedisError(error);
      }
    }
    return this.readMemory(key);
  }

  private readMemory(key: string): string | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  private async write(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      try {
        await this.withTimeout(this.redis.set(key, value, { ex: Math.max(1, Math.floor(ttlSeconds)) }));
        this.memory.delete(key);
        return;
      } catch (error) {
        this.noteRedisError(error);
      }
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    this.trimMemory();
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Redis did not answer within ${REDIS_TIMEOUT_MS}ms`)), REDIS_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
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
