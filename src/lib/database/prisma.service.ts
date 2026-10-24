import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

function parseDatabaseUrl(url: string) {
  const match = url.match(
    /^(?:postgresql|postgres):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/i,
  );
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  const [, user, password, host, port] = match;
  return { user, password, host, port: Number(port) };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const { user, password, host, port } = parseDatabaseUrl(
      process.env.DATABASE_URL ?? '',
    );
    const adapter = new PrismaPg({
      host,
      port,
      user,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    });
    super({ adapter });
  }

  async onModuleInit() {
    await (this as any).$connect();
  }

  async onModuleDestroy() {
    await (this as any).$disconnect();
  }
}
