import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { TeamService } from './team.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

type AuthedRequest = Request & { user: { id: string; role: string } };

@Controller('teams')
export class TeamController {
  constructor(@Inject(TeamService) private readonly teamService: TeamService) {}

  @Get()
  findByHackathon(
    @Query('hackathonId') hackathonId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.teamService.findByHackathon(hackathonId, page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: AuthedRequest, @Body() body: CreateTeamDto) {
    return this.teamService.create(req.user.id, body);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: UpdateTeamDto) {
    return this.teamService.update(id, req.user, body);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.teamService.remove(id, req.user);
  }

  @UseGuards(AuthGuard)
  @Post(':id/join')
  join(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.teamService.join(id, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/leave')
  leave(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.teamService.leave(id, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id/members/:userId')
  removeMember(@Req() req: AuthedRequest, @Param('id') id: string, @Param('userId') userId: string) {
    return this.teamService.removeMember(id, userId, req.user);
  }
}
