export type RedisUrlResult = { url: string } | { url: null; reason: string };

/**
 * Turns whatever was pasted into the REDIS_URL setting into a usable connection address.
 *
 * Redis providers show the address in several shapes: with quotes, behind the variable name, or inside a
 * ready made command such as `redis-cli --tls -u rediss://default:secret@host:6379`. We look for the
 * `redis://` or `rediss://` address inside the text and use that. Anything else is reported with a reason
 * that is safe to log (it never includes the value itself, which contains a password).
 */
export function parseRedisUrl(raw: string | undefined): RedisUrlResult {
  const value = raw?.trim();
  if (!value) return { url: null, reason: 'not set' };

  const match = /rediss?:\/\/[^\s'"`]+/i.exec(value);
  if (!match) {
    if (/^https?:\/\//i.test(value)) {
      return { url: null, reason: 'it is a web (REST) address; use the TCP address that starts with rediss://' };
    }
    return { url: null, reason: `it does not contain a redis:// or rediss:// address (${value.length} characters)` };
  }

  try {
    const parsed = new URL(match[0]);
    if (!parsed.hostname) return { url: null, reason: 'the address has no host name' };
  } catch {
    return { url: null, reason: 'the address is not a valid URL' };
  }
  return { url: match[0] };
}
