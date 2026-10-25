import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Test point for deployments: open /health to confirm the backend is up.
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
