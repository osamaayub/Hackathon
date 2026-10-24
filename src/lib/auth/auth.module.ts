import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { MailModule } from '../mail/mail.module.js';

@Global()
@Module({
  imports: [PrismaModule, MailModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
