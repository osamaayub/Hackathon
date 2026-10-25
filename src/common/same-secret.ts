import { createHash, timingSafeEqual } from 'node:crypto';

/** Compares two secrets without leaking, through timing, how much of them matched. */
export function sameSecret(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
