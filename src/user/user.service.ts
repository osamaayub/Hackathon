import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/database/prisma.service.js';
import { isNotFound } from '../common/prisma-errors.js';
import { parsePagination, toPaginated } from '../common/pagination.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';

const profileSelect = {
  id: true,
  email: true,
  name: true,
  emailVerified: true,
  image: true,
  role: true,
  createdAt: true,
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId }, select: profileSelect });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      return await this.prisma.client.user.update({
        where: { id: userId },
        data: { ...(dto.name !== undefined && { name: dto.name }) },
        select: profileSelect,
      });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async list(page?: string, pageSize?: string, search?: string) {
    const pagination = parsePagination(page, pageSize);
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: profileSelect,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return toPaginated(items, total, pagination);
  }

  async updateRole(targetUserId: string, dto: UpdateRoleDto) {
    const target = await this.prisma.client.user.findUnique({ where: { id: targetUserId } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === 'ADMIN' && dto.role !== 'ADMIN') {
      const adminCount = await this.prisma.client.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new ConflictException('Cannot demote the last remaining admin');
      }
    }

    return this.prisma.client.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: profileSelect,
    });
  }
}
