import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { ScheduleService } from './schedule.service.js';
import { CreateScheduleItemDto } from './dto/create-schedule-item.dto.js';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto.js';

type AuthedRequest = Request & { user: { id: string; role: string } };

@UseGuards(AuthGuard)
@Controller()
export class ScheduleController {
  constructor(@Inject(ScheduleService) private readonly scheduleService: ScheduleService) {}

  @Get('hackathons/:id/schedule')
  listByHackathon(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.scheduleService.listByHackathon(id, req.user.role, page, pageSize);
  }

  @UseGuards(AdminGuard)
  @Post('hackathons/:id/schedule')
  create(@Param('id') id: string, @Body() body: CreateScheduleItemDto) {
    return this.scheduleService.create(id, body);
  }

  @UseGuards(AdminGuard)
  @Patch('schedule/:id')
  update(@Param('id') id: string, @Body() body: UpdateScheduleItemDto) {
    return this.scheduleService.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete('schedule/:id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
