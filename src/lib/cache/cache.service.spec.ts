import { CacheService } from './cache.service.js';

/** A tiny stand in for the Upstash client: the same get/set/del/ping calls, backed by a Map. */
function fakeUpstash() {
  const store = new Map<string, string>();
  const ttls = new Map<string, number>();
  return {
    store,
    ttls,
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string, options?: { ex?: number }) => {
      store.set(key, value);
      if (options?.ex) ttls.set(key, options.ex);
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      let n = 0;
      for (const k of keys) if (store.delete(k)) n++;
      return n;
    }),
    ping: vi.fn(async () => 'PONG'),
  } as any;
}

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

describe('CacheService (Upstash Redis)', () => {
  it('uses Redis when a client is provided, with a prefixed key, a JSON value and a TTL', async () => {
    const redis = fakeUpstash();
    const cache = new CacheService(redis);
    expect(cache.backend).toBe('redis');

    await cache.set('k', { n: 5 }, 60);
    expect(await cache.get('k')).toEqual({ n: 5 });
    expect(redis.store.get('hackathon:k')).toBe(JSON.stringify({ n: 5 }));
    expect(redis.ttls.get('hackathon:k')).toBe(60);

    await cache.del('k');
    expect(redis.store.has('hackathon:k')).toBe(false);
  });

  it("wrap caches in Redis, so a second instance sees the first one's result", async () => {
    const redis = fakeUpstash();
    const loader = vi.fn(async () => ({ rows: 3 }));
    await new CacheService(redis).wrap('board', 60, loader);
    expect(await new CacheService(redis).wrap('board', 60, loader)).toEqual({ rows: 3 });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('status() tells a working Redis from an unreachable one, and memory from both', async () => {
    expect(await new CacheService(null).status()).toBe('memory');
    expect(await new CacheService(fakeUpstash()).status()).toBe('redis');
    const down = { ping: vi.fn().mockRejectedValue(new Error('fetch failed')) } as any;
    expect(await new CacheService(down).status()).toBe('redis-unreachable');
  });

  it('falls back to memory instead of throwing when Redis fails', async () => {
    const broken = {
      get: vi.fn().mockRejectedValue(new Error('fetch failed')),
      set: vi.fn().mockRejectedValue(new Error('fetch failed')),
      del: vi.fn().mockRejectedValue(new Error('fetch failed')),
      ping: vi.fn().mockRejectedValue(new Error('fetch failed')),
    } as any;
    const cache = new CacheService(broken);

    await expect(cache.set('k', 'v', 60)).resolves.toBeUndefined();
    expect(await cache.get('k')).toBe('v'); // served from the memory copy
    await expect(cache.del('k')).resolves.toBeUndefined();
    expect(await cache.wrap('other', 60, async () => 42)).toBe(42);
  });

  it('gives up on a Redis that does not answer instead of making the request wait', async () => {
    vi.useFakeTimers();
    try {
      const hanging = { get: vi.fn(() => new Promise(() => undefined)), set: vi.fn(() => new Promise(() => undefined)) } as any;
      const cache = new CacheService(hanging);

      const pending = cache.set('k', 'v', 60);
      await vi.advanceTimersByTimeAsync(1_600);
      await expect(pending).resolves.toBeUndefined();

      const read = cache.get('k');
      await vi.advanceTimersByTimeAsync(1_600);
      expect(await read).toBe('v'); // memory copy written when the Redis write timed out
    } finally {
      vi.useRealTimers();
    }
  });
});
