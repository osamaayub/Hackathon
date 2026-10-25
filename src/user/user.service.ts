import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
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
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async me(userId: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId }, select: profileSelect });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Everything the profile page shows about the user's hackathons, in one request: the team they are on,
   * their role, the team's submission and task progress. (The page used to build this from about twenty
   * separate requests, which is slow on a phone or any slow connection.)
   */
  async activity(userId: string) {
    const memberships = await this.prisma.client.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            hackathon: true,
            submission: true,
            completions: { select: { id: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
      },
    });

    const hackathonIds = memberships.map((m) => m.team.hackathonId);
    const totals = hackathonIds.length
      ? await this.prisma.client.task.groupBy({
          by: ['hackathonId'],
          where: { hackathonId: { in: hackathonIds } },
          _count: { _all: true },
        })
      : [];

    return memberships
      .map((m) => ({
        hackathon: m.team.hackathon,
        team: {
          id: m.team.id,
          name: m.team.name,
          description: m.team.description,
          hackathonId: m.team.hackathonId,
          members: m.team.members.map((tm) => ({
            id: tm.id,
            teamId: tm.teamId,
            userId: tm.userId,
            role: tm.role,
            joinedAt: tm.joinedAt,
            user: tm.user,
          })),
        },
        role: m.role,
        joinedAt: m.joinedAt,
        submission: m.team.submission,
        tasksDone: m.team.completions.length,
        tasksTotal: totals.find((t) => t.hackathonId === m.team.hackathonId)?._count._all ?? 0,
      }))
      .sort((x, y) => y.hackathon.startDate.getTime() - x.hackathon.startDate.getTime());
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
