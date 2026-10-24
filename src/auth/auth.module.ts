import { Module } from '@nestjs/common';
import { AuthModule as LibAuthModule } from '../lib/auth/auth.module.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [LibAuthModule],
  exports: [LibAuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
