/**
 * The website addresses the backend trusts, for CORS and for Better Auth's origin check.
 *
 * FRONTEND_URL may hold several addresses separated by commas, for example a production domain plus the
 * extra *.vercel.app alias. The first one is the "main" address and is used in links sent by email.
 * Outside production the usual local addresses (localhost and 127.0.0.1 on ports 3000 and 3001) are also
 * allowed, so a dev server on a slightly different address does not hit a CORS error.
 */
const DEFAULT_FRONTEND = 'http://localhost:3000';

function clean(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function configured(): string[] {
  return (process.env.FRONTEND_URL || DEFAULT_FRONTEND)
    .split(',')
    .map(clean)
    .filter(Boolean);
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
}

export function allowedOrigins(): string[] {
  const origins = new Set(configured());
  if (!isProduction()) {
    for (const host of ['localhost', '127.0.0.1']) {
      for (const port of [3000, 3001]) origins.add(`http://${host}:${port}`);
    }
  }
  return [...origins];
}

/** The address used when the backend has to build a link to the website. */
export function primaryFrontendUrl(): string {
  return configured()[0] ?? DEFAULT_FRONTEND;
}

/** Callback for the `cors` option. Requests without an Origin header (curl, server to server) are allowed. */
export function corsOrigin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
  callback(null, !origin || allowedOrigins().includes(clean(origin)));
}
