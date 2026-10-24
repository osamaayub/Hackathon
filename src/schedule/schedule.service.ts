import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/database/prisma.service.js';
import { isNotFound } from '../common/prisma-errors.js';
import { parsePagination, toPaginated } from '../common/pagination.js';
import { CreateScheduleItemDto } from './dto/create-schedule-item.dto.js';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto.js';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async listByHackathon(hackathonId: string, requesterRole: string, page?: string, pageSize?: string) {
    const hackathon = await this.prisma.client.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon || (hackathon.status === 'DRAFT' && requesterRole !== 'ADMIN')) {
      throw new NotFoundException('Hackathon not found');
    }

    const pagination = parsePagination(page, pageSize);
    const where = { hackathonId };

    const [items, total] = await Promise.all([
      this.prisma.client.scheduleItem.findMany({
        where,
        orderBy: { time: 'asc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.client.scheduleItem.count({ where }),
    ]);

    return toPaginated(items, total, pagination);
  }

  async create(hackathonId: string, dto: CreateScheduleItemDto) {
    const hackathon = await this.prisma.client.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    return this.prisma.client.scheduleItem.create({
      data: { hackathonId, title: dto.title, time: new Date(dto.time) },
    });
  }

  async update(id: string, dto: UpdateScheduleItemDto) {
    try {
      return await this.prisma.client.scheduleItem.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.time !== undefined && { time: new Date(dto.time) }),
        },
      });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Schedule item not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.client.scheduleItem.delete({ where: { id } });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Schedule item not found');
      }
      throw error;
    }
    return { success: true };
  }
}
