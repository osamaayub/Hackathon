import { Controller, Get, Header, UseGuards, Inject } from '@nestjs/common';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { CommunityService } from './community.service.js';

// `private, max-age` lets the browser reuse the answer for a short while on repeat visits.
@UseGuards(AuthGuard)
@Controller()
export class CommunityController {
  constructor(@Inject(CommunityService) private readonly community: CommunityService) {}

  @Get('leaderboard')
  @Header('Cache-Control', 'private, max-age=30')
  leaderboard() {
    return this.community.getLeaderboard();
  }

  @Get('projects')
  @Header('Cache-Control', 'private, max-age=30')
  projects() {
    return this.community.getProjects();
  }
}
