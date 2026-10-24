import { Global, Module } from '@nestjs/common';
import {
  ArcjetModule as ArcjetNestModule,
  detectBot,
  fixedWindow,
  shield,
  tokenBucket,
} from '@arcjet/nest';
import { ArcjetService } from './arcjet.service.js';

type ArcjetMode = 'LIVE' | 'DRY_RUN';

// DRY_RUN logs decisions without blocking; LIVE blocks. Defaults to DRY_RUN.
function resolveMode(): ArcjetMode {
  return process.env.ARCJET_MODE === 'LIVE' ? 'LIVE' : 'DRY_RUN';
}

@Global()
@Module({
  imports: [
    ArcjetNestModule.forRootAsync({
      isGlobal: true,
      useFactory: () => {
        const key = process.env.ARCJET_KEY;
        if (!key) {
          throw new Error(
            'ARCJET_KEY is missing. Get one at https://app.arcjet.com and set it in .env',
          );
        }
        const mode = resolveMode();

        return {
          key,
          rules: [
            // Blocks common attacks (SQL injection, XSS, etc.)
            shield({ mode }),
            // Blocks automated clients, but lets search engines through
            // In development, also let curl/scripts through so rate limits can be tested locally
            detectBot({
              mode,
              allow: [
                'CATEGORY:SEARCH_ENGINE',
                ...(process.env.ARCJET_ENV === 'development'
                  ? ([
                      'CURL',
                      'POSTMAN',
                      'HTTPIE',
                      'CATEGORY:PROGRAMMATIC',
                    ] as const)
                  : []),
              ],
            }),
            // Dev mode has no real per-user IPs (everything is localhost) and the
            // frontend fires far more requests per click (every page re-checks auth
            // on navigation), so the production limits below are far too strict there.
            ...(process.env.ARCJET_ENV === 'development'
              ? [
                  tokenBucket({ mode, refillRate: 50, interval: 10, capacity: 100 }),
                  fixedWindow({ mode, window: '60s', max: 200 }),
                ]
              : [
                  // 10 requests burst, refilling 5 every 10s, per IP
                  tokenBucket({ mode, refillRate: 5, interval: 10, capacity: 10 }),
                  // Hard cap: max 10 requests per IP in each 60s window
                  fixedWindow({ mode, window: '60s', max: 10 }),
                ]),
          ],
        };
      },
    }),
  ],
  providers: [ArcjetService],
  exports: [ArcjetService],
})
export class ArcjetModule {}
