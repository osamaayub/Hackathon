import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards, Inject } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../common/guards/auth.guard.js';
import { AdminGuard } from '../common/guards/admin.guard.js';
import { UserService } from './user.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

type AuthedRequest = Request & { user: { id: string; role: string } };

@Controller('users')
export class UserController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: AuthedRequest) {
    return this.userService.me(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthedRequest, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, body);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Get()
  list(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('search') search?: string) {
    return this.userService.list(page, pageSize, search);
  }

  @UseGuards(AuthGuard, AdminGuard)
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.userService.updateRole(id, body);
  }
}
