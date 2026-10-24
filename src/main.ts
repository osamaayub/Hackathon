import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

// Load .env into process.env (Node built-in, no dotenv needed)
try {
  process.loadEnvFile();
} catch {
  // No .env file - rely on real environment variables
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
