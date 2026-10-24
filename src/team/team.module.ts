import { Module } from '@nestjs/common';
import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';

@Module({
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
