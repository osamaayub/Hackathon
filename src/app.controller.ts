import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service.js';
import { SkipArcjet } from './common/decorators/skip-arcjet.decorator.js';

@Controller()
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @SkipArcjet()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Test point for deployments: open /health to confirm the backend is up.
  @SkipArcjet()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'hackathon-backend',
      message: this.appService.getHello(),
      environment: process.env.NODE_ENV ?? 'development',
      time: new Date().toISOString(),
    };
  }
}
