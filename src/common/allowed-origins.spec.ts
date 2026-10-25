import { allowedOrigins, corsOrigin, primaryFrontendUrl } from './allowed-origins.js';

const saved = { FRONTEND_URL: process.env.FRONTEND_URL, NODE_ENV: process.env.NODE_ENV, VERCEL: process.env.VERCEL };
function setEnv(env: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

afterEach(() => setEnv(saved));

function decide(origin: string | undefined) {
  let allowed: boolean | undefined;
  corsOrigin(origin, (_error, allow) => (allowed = allow));
  return allowed;
}

describe('allowed origins', () => {
  it('reads a comma separated list and strips trailing slashes', () => {
    setEnv({ FRONTEND_URL: 'https://a.example.com/, https://b.example.com', NODE_ENV: 'production', VERCEL: undefined });
    expect(allowedOrigins()).toEqual(['https://a.example.com', 'https://b.example.com']);
    expect(primaryFrontendUrl()).toBe('https://a.example.com'); // the first one is used in emailed links
  });

  it('in production allows only the configured addresses', () => {
    setEnv({ FRONTEND_URL: 'https://app.example.com', NODE_ENV: 'production', VERCEL: undefined });
    expect(decide('https://app.example.com')).toBe(true);
    expect(decide('http://localhost:3000')).toBe(false);
    expect(decide('https://evil.example.com')).toBe(false);
  });

  it('treats Vercel as production even without NODE_ENV', () => {
    setEnv({ FRONTEND_URL: 'https://app.example.com', NODE_ENV: undefined, VERCEL: '1' });
    expect(decide('http://localhost:3001')).toBe(false);
  });

  it('outside production also allows the usual local addresses', () => {
    setEnv({ FRONTEND_URL: 'http://localhost:3000', NODE_ENV: 'development', VERCEL: undefined });
    for (const origin of ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']) {
      expect(decide(origin)).toBe(true);
    }
    expect(decide('http://localhost:4000')).toBe(false);
  });

  it('allows requests that send no Origin (curl, server to server)', () => {
    setEnv({ FRONTEND_URL: 'https://app.example.com', NODE_ENV: 'production', VERCEL: undefined });
    expect(decide(undefined)).toBe(true);
  });

  it('ignores a trailing slash on the incoming origin', () => {
    setEnv({ FRONTEND_URL: 'https://app.example.com', NODE_ENV: 'production', VERCEL: undefined });
    expect(decide('https://app.example.com/')).toBe(true);
  });

  it('defaults to localhost:3000 when nothing is configured', () => {
    setEnv({ FRONTEND_URL: undefined, NODE_ENV: 'production', VERCEL: undefined });
    expect(primaryFrontendUrl()).toBe('http://localhost:3000');
    expect(allowedOrigins()).toEqual(['http://localhost:3000']);
  });
});
