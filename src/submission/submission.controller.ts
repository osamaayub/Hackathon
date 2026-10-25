import { Body, Controller, Get, Param, Put, Query, Req, UseGuards, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { SubmissionService } from './submission.service.js';
import { UpsertSubmissionDto } from './dto/upsert-submission.dto.js';

type AuthedRequest = Request & { user: { id: string; role: string } };

@UseGuards(AuthGuard)
@Controller()
export class SubmissionController {
  constructor(@Inject(SubmissionService) private readonly submissionService: SubmissionService) {}

  @Get('teams/:id/submission')
  getByTeam(@Param('id') id: string) {
    return this.submissionService.getByTeam(id);
  }

  @Put('teams/:id/submission')
  upsert(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: UpsertSubmissionDto) {
    return this.submissionService.upsert(id, req.user.id, body);
  }

  @Get('hackathons/:id/submissions')
  listByHackathon(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.submissionService.listByHackathon(id, req.user.role, page, pageSize);
  }
}
