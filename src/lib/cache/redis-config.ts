export type RedisConfig = { url: string; token: string } | { url: null; reason: string };

type Env = Record<string, string | undefined>;

/** Removes the quotes and spaces people often paste around a value. */
function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
}

/**
 * Reads the Upstash REST credentials from the environment.
 *
 * The names Upstash itself uses (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) are preferred, and the
 * names Vercel's Redis integration adds (KV_REST_API_URL and KV_REST_API_TOKEN) work too. Problems are
 * reported with a reason that is safe to log: it never contains the token.
 */
export function readRedisConfig(env: Env = process.env): RedisConfig {
  const url = clean(env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL);
  const token = clean(env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN);

  if (!url && !token) {
    if (clean(env.REDIS_URL) || clean(env.KV_URL)) {
      return {
        url: null,
        reason:
          'REDIS_URL is the TCP address, which this app no longer uses. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN instead (the REST values on the Upstash database page)',
      };
    }
    return { url: null, reason: 'not set' };
  }
  if (!url) return { url: null, reason: 'UPSTASH_REDIS_REST_TOKEN is set but UPSTASH_REDIS_REST_URL is missing' };
  if (!token) return { url: null, reason: 'UPSTASH_REDIS_REST_URL is set but UPSTASH_REDIS_REST_TOKEN is missing' };

  if (/^rediss?:\/\//i.test(url)) {
    return { url: null, reason: 'UPSTASH_REDIS_REST_URL must be the https:// REST address, not the rediss:// TCP one' };
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('not a web address');
  } catch {
    return { url: null, reason: 'UPSTASH_REDIS_REST_URL is not a valid https:// address' };
  }
  return { url, token };
}
