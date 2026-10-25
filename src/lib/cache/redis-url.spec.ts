import { parseRedisUrl } from './redis-url.js';

const GOOD = 'rediss://default:s3cret@host.example.com:6379';

describe('parseRedisUrl', () => {
  it('accepts a plain address', () => {
    expect(parseRedisUrl(GOOD)).toEqual({ url: GOOD });
    expect(parseRedisUrl('redis://localhost:6379')).toEqual({ url: 'redis://localhost:6379' });
  });

  it('ignores surrounding spaces and quotes', () => {
    expect(parseRedisUrl(`  "${GOOD}"  `)).toEqual({ url: GOOD });
    expect(parseRedisUrl(`'${GOOD}'`)).toEqual({ url: GOOD });
  });

  it('pulls the address out of a pasted redis-cli command', () => {
    expect(parseRedisUrl(`redis-cli --tls -u ${GOOD}`)).toEqual({ url: GOOD });
  });

  it('pulls the address out of a pasted KEY=value line', () => {
    expect(parseRedisUrl(`REDIS_URL="${GOOD}"`)).toEqual({ url: GOOD });
  });

  it('treats an empty or missing value as not set', () => {
    expect(parseRedisUrl(undefined)).toEqual({ url: null, reason: 'not set' });
    expect(parseRedisUrl('   ')).toEqual({ url: null, reason: 'not set' });
  });

  it('explains a REST web address', () => {
    const result = parseRedisUrl('https://eager-name-1234.upstash.io');
    expect(result.url).toBeNull();
    expect((result as { reason: string }).reason).toMatch(/REST/);
  });

  it('rejects text that has no redis address, without echoing it', () => {
    const result = parseRedisUrl('AbCdEfGhIjKlMnOpQrStUvWx-password-only');
    expect(result.url).toBeNull();
    expect(JSON.stringify(result)).not.toContain('password-only'); // the reason must never contain the value
  });

  it('rejects an address with no host', () => {
    expect(parseRedisUrl('rediss://').url).toBeNull();
  });
});
