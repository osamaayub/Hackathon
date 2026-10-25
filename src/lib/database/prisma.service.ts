import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    // Fail loudly instead of hanging: on serverless hosts a stuck connection would otherwise
    // keep every request waiting until the platform kills the function.
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Timed out after 20s connecting to the database. Check DATABASE_URL and network access.')),
        20_000,
      );
    });
    try {
      await Promise.race([this.prisma.$connect(), timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get client(): PrismaClient {
    return this.prisma;
  }
}
