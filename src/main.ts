import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule, ObserveInstrument } from './app.module.js';

// Load .env into process.env (Node built-in, no dotenv needed)
try {
  process.loadEnvFile();
} catch {
  // No .env file - rely on real environment variables
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
  });
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
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
