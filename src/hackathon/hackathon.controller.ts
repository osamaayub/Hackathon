import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { HackathonService } from './hackathon.service.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';

type AuthedRequest = Request & { user: { id: string; role: string } };

@Controller('hackathons')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @Req() req: AuthedRequest,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.hackathonService.findAll(req.user.role, page, pageSize, status);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.hackathonService.findOne(id, req.user.role);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Post()
  create(@Body() body: CreateHackathonDto) {
    return this.hackathonService.create(body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateHackathonDto) {
    return this.hackathonService.update(id, body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hackathonService.remove(id);
  }
}
