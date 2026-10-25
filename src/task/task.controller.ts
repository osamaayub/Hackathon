import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { TaskService } from './task.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

type AuthedRequest = Request & { user: { id: string; role: string } };

@UseGuards(AuthGuard)
@Controller()
export class TaskController {
  constructor(@Inject(TaskService) private readonly taskService: TaskService) {}

  @Get('hackathons/:id/tasks')
  listByHackathon(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.taskService.listByHackathon(id, req.user.role, req.user.id, page, pageSize);
  }

  @UseGuards(AdminGuard)
  @Post('hackathons/:id/tasks')
  create(@Param('id') id: string, @Body() body: CreateTaskDto) {
    return this.taskService.create(id, body);
  }

  @UseGuards(AdminGuard)
  @Patch('tasks/:id')
  update(@Param('id') id: string, @Body() body: UpdateTaskDto) {
    return this.taskService.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete('tasks/:id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }

  @Post('tasks/:id/complete')
  complete(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.taskService.complete(id, req.user.id);
  }

  @Delete('tasks/:id/complete')
  uncomplete(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.taskService.uncomplete(id, req.user.id);
  }
}
