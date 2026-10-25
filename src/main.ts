import type { IncomingMessage, ServerResponse } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

// Load .env into process.env (Node built-in, no dotenv needed)
try {
  process.loadEnvFile();
} catch {
  // No .env file - rely on real environment variables
}

/** Creates and configures the Nest application. Used both for a normal server and for Vercel. */
async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // Behind a hosting proxy (Railway, Render, Fly, ...) every request would otherwise appear to come
  // from the proxy's IP, and Arcjet's per IP rate limits would hit all visitors at once.
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  }
  app.enableCors({
    // Browsers send the origin without a trailing slash, so strip one if the setting has it.
    origin: (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, ''),
    credentials: true,
  });
  return app;
}

// Vercel runs the app as a serverless function: it needs an exported request handler, and a
// server that calls listen() never receives traffic there. The app is created on the first
// request and then reused by later requests on the same instance.
let appPromise: Promise<NestExpressApplication> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  appPromise ??= createApp()
    .then(async (app) => {
      await app.init();
      return app;
    })
    .catch((error) => {
      appPromise = undefined; // let the next request try again instead of caching the failure
      throw error;
    });

  const app = await appPromise;
  app.getHttpAdapter().getInstance()(req, res);
}

// Everywhere else (local development, Render, Railway, Docker) run as a normal server.
if (!process.env.VERCEL) {
  const app = await createApp();
  await app.listen(process.env.PORT || 8080);
}
