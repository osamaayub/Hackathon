import { readRedisConfig } from './redis-config.js';

const URL_OK = 'https://electric-thrush-81837.upstash.io';

describe('readRedisConfig', () => {
  it('reads the Upstash REST names', () => {
    expect(readRedisConfig({ UPSTASH_REDIS_REST_URL: URL_OK, UPSTASH_REDIS_REST_TOKEN: 'tok' })).toEqual({ url: URL_OK, token: 'tok' });
  });

  it('also reads the names Vercel adds', () => {
    expect(readRedisConfig({ KV_REST_API_URL: URL_OK, KV_REST_API_TOKEN: 'tok' })).toEqual({ url: URL_OK, token: 'tok' });
  });

  it('prefers the Upstash names when both exist', () => {
    const config = readRedisConfig({ UPSTASH_REDIS_REST_URL: URL_OK, UPSTASH_REDIS_REST_TOKEN: 'a', KV_REST_API_URL: 'https://other.upstash.io', KV_REST_API_TOKEN: 'b' });
    expect(config).toEqual({ url: URL_OK, token: 'a' });
  });

  it('strips quotes and spaces around pasted values', () => {
    expect(readRedisConfig({ UPSTASH_REDIS_REST_URL: ` "${URL_OK}" `, UPSTASH_REDIS_REST_TOKEN: " 'tok' " })).toEqual({ url: URL_OK, token: 'tok' });
  });

  it('reports not set when nothing is configured', () => {
    expect(readRedisConfig({})).toEqual({ url: null, reason: 'not set' });
  });

  it('tells people who still have the old TCP address what to set instead', () => {
    const result = readRedisConfig({ REDIS_URL: 'rediss://default:pw@host.upstash.io:6379' });
    expect(result.url).toBeNull();
    expect((result as { reason: string }).reason).toMatch(/UPSTASH_REDIS_REST_URL/);
    expect(JSON.stringify(result)).not.toContain('pw@'); // never echoes the old value
  });

  it('asks for the missing half', () => {
    expect((readRedisConfig({ UPSTASH_REDIS_REST_URL: URL_OK }) as { reason: string }).reason).toMatch(/TOKEN is missing/);
    expect((readRedisConfig({ UPSTASH_REDIS_REST_TOKEN: 'tok' }) as { reason: string }).reason).toMatch(/URL is missing/);
  });

  it('rejects the TCP address in the URL slot, and anything that is not a web address', () => {
    expect((readRedisConfig({ UPSTASH_REDIS_REST_URL: 'rediss://default:pw@h.upstash.io:6379', UPSTASH_REDIS_REST_TOKEN: 't' }) as { reason: string }).reason).toMatch(/https:\/\//);
    expect((readRedisConfig({ UPSTASH_REDIS_REST_URL: 'not a url', UPSTASH_REDIS_REST_TOKEN: 't' }) as { reason: string }).reason).toMatch(/not a valid/);
  });

  it('never puts the token in a reason', () => {
    const result = readRedisConfig({ UPSTASH_REDIS_REST_URL: 'not a url', UPSTASH_REDIS_REST_TOKEN: 'SUPER-SECRET-TOKEN' });
    expect(JSON.stringify(result)).not.toContain('SUPER-SECRET-TOKEN');
  });
});
