import RedisMock from 'ioredis-mock';
import { CacheService } from './cache.service.js';

const fakeRedis = () => new (RedisMock as any)() as any;

describe('CacheService (memory fallback)', () => {
  afterEach(() => vi.useRealTimers());

  it('stores and returns values, and reports the memory backend', async () => {
    const cache = new CacheService(null);
    expect(cache.backend).toBe('memory');
    await cache.set('k', { a: 1 }, 60);
    expect(await cache.get('k')).toEqual({ a: 1 });
    expect(await cache.get('missing')).toBeNull();
  });

  it('expires values after the TTL', async () => {
    vi.useFakeTimers();
    const cache = new CacheService(null);
    await cache.set('k', 'v', 10);
    vi.advanceTimersByTime(9_000);
    expect(await cache.get('k')).toBe('v');
    vi.advanceTimersByTime(2_000);
    expect(await cache.get('k')).toBeNull();
  });

  it('deletes keys', async () => {
    const cache = new CacheService(null);
    await cache.set('a', 1, 60);
    await cache.set('b', 2, 60);
    await cache.del('a', 'b');
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });

  it('wrap loads once, caches the result, and shares one load between concurrent callers', async () => {
    const cache = new CacheService(null);
    const loader = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return 'loaded';
    });

    const results = await Promise.all([cache.wrap('k', 60, loader), cache.wrap('k', 60, loader), cache.wrap('k', 60, loader)]);
    expect(results).toEqual(['loaded', 'loaded', 'loaded']);
    expect(loader).toHaveBeenCalledTimes(1);

    await cache.wrap('k', 60, loader);
    expect(loader).toHaveBeenCalledTimes(1); // served from the cache now
  });

  it('does not cache a failed load, so the next call tries again', async () => {
    const cache = new CacheService(null);
    const loader = vi.fn().mockRejectedValueOnce(new Error('db down')).mockResolvedValueOnce('ok');
    await expect(cache.wrap('k', 60, loader)).rejects.toThrow('db down');
    expect(await cache.wrap('k', 60, loader)).toBe('ok');
  });
});

describe('CacheService (Redis)', () => {
  it('uses Redis when a client is provided', async () => {
    const redis = fakeRedis();
    const cache = new CacheService(redis);
    expect(cache.backend).toBe('redis');

    await cache.set('k', { n: 5 }, 60);
    expect(await cache.get('k')).toEqual({ n: 5 });
    expect(await redis.get('hackathon:k')).toBe(JSON.stringify({ n: 5 })); // prefixed key, JSON value
    expect(await redis.ttl('hackathon:k')).toBeGreaterThan(0);

    await cache.del('k');
    expect(await redis.get('hackathon:k')).toBeNull();
  });

  it('status() tells a working Redis from an unreachable one, and memory from both', async () => {
    expect(await new CacheService(null).status()).toBe('memory');
    expect(await new CacheService(fakeRedis()).status()).toBe('redis');
    const down = { ping: vi.fn().mockRejectedValue(new Error('refused')) } as any;
    expect(await new CacheService(down).status()).toBe('redis-unreachable');
  });

  it('falls back to memory instead of throwing when Redis fails', async () => {
    const broken = {
      get: vi.fn().mockRejectedValue(new Error('connection refused')),
      set: vi.fn().mockRejectedValue(new Error('connection refused')),
      del: vi.fn().mockRejectedValue(new Error('connection refused')),
      quit: vi.fn().mockResolvedValue('OK'),
    } as any;
    const cache = new CacheService(broken);

    await expect(cache.set('k', 'v', 60)).resolves.toBeUndefined();
    expect(await cache.get('k')).toBe('v'); // served from the memory copy
    await expect(cache.del('k')).resolves.toBeUndefined();
    expect(await cache.wrap('other', 60, async () => 42)).toBe(42);
  });
});
