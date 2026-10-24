import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/database/prisma.service.js';
import { isNotFound, isUniqueViolation } from '../common/prisma-errors.js';
import { parsePagination, toPaginated } from '../common/pagination.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async listByHackathon(
    hackathonId: string,
    requesterRole: string,
    requesterId: string,
    page?: string,
    pageSize?: string,
  ) {
    const hackathon = await this.prisma.client.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon || (hackathon.status === 'DRAFT' && requesterRole !== 'ADMIN')) {
      throw new NotFoundException('Hackathon not found');
    }

    const pagination = parsePagination(page, pageSize);
    const where = { hackathonId };

    const [items, total, membership] = await Promise.all([
      this.prisma.client.task.findMany({ where, orderBy: { order: 'asc' }, skip: pagination.skip, take: pagination.take }),
      this.prisma.client.task.count({ where }),
      this.prisma.client.teamMember.findUnique({
        where: { hackathonId_userId: { hackathonId, userId: requesterId } },
      }),
    ]);

    const completedTaskIds = membership
      ? new Set(
          (
            await this.prisma.client.taskCompletion.findMany({
              where: { teamId: membership.teamId, taskId: { in: items.map((t) => t.id) } },
              select: { taskId: true },
            })
          ).map((c) => c.taskId),
        )
      : new Set<string>();

    return toPaginated(
      items.map((t) => ({ ...t, completedByMyTeam: completedTaskIds.has(t.id) })),
      total,
      pagination,
    );
  }

  async create(hackathonId: string, dto: CreateTaskDto) {
    const hackathon = await this.prisma.client.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const order = await this.prisma.client.task.count({ where: { hackathonId } });

    return this.prisma.client.task.create({
      data: { hackathonId, title: dto.title, description: dto.description, order },
    });
  }

  async update(taskId: string, dto: UpdateTaskDto) {
    try {
      return await this.prisma.client.task.update({
        where: { id: taskId },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.order !== undefined && { order: dto.order }),
        },
      });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
  }

  async remove(taskId: string) {
    try {
      await this.prisma.client.task.delete({ where: { id: taskId } });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Task not found');
      }
      throw error;
    }
    return { success: true };
  }

  async complete(taskId: string, userId: string) {
    const teamId = await this.resolveCallerTeam(taskId, userId);

    try {
      return await this.prisma.client.taskCompletion.create({
        data: { taskId, teamId, completedByUserId: userId },
      });
    } catch (error) {
      if (isUniqueViolation(error, 'taskId_teamId')) {
        throw new ConflictException('This task is already complete for your team');
      }
      throw error;
    }
  }

  async uncomplete(taskId: string, userId: string) {
    const teamId = await this.resolveCallerTeam(taskId, userId);

    try {
      await this.prisma.client.taskCompletion.delete({ where: { taskId_teamId: { taskId, teamId } } });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('This task was not marked complete for your team');
      }
      throw error;
    }
    return { success: true };
  }

  /** Resolves the caller's team for the task's hackathon (one team per hackathon, per spec 0001). */
  private async resolveCallerTeam(taskId: string, userId: string): Promise<string> {
    const task = await this.prisma.client.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const membership = await this.prisma.client.teamMember.findUnique({
      where: { hackathonId_userId: { hackathonId: task.hackathonId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You must be in a team for this hackathon to complete tasks');
    }

    return membership.teamId;
  }
}
