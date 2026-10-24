import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../database/prisma.module.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
