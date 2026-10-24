import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/database/prisma.service.js';
import { isNotFound } from '../common/prisma-errors.js';
import { parsePagination, toPaginated } from '../common/pagination.js';
import { CreateHackathonDto } from './dto/create-hackathon.dto.js';
import { UpdateHackathonDto } from './dto/update-hackathon.dto.js';

type HackathonStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

// DRAFT -> PUBLISHED -> CLOSED. PUBLISHED -> DRAFT is allowed only while no team exists yet.
const VALID_NEXT_STATUSES: Record<HackathonStatus, HackathonStatus[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['DRAFT', 'CLOSED'],
  CLOSED: [],
};

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(requesterRole: string, page?: string, pageSize?: string, statusFilter?: string) {
    const pagination = parsePagination(page, pageSize);
    const isAdmin = requesterRole === 'ADMIN';

    const where = isAdmin
      ? statusFilter
        ? { status: statusFilter as HackathonStatus }
        : {}
      : { status: { in: ['PUBLISHED', 'CLOSED'] as HackathonStatus[] } };

    const [items, total] = await Promise.all([
      this.prisma.client.hackathon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { teams: true } } },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.client.hackathon.count({ where }),
    ]);

    return toPaginated(items, total, pagination);
  }

  async findOne(id: string, requesterRole: string) {
    const hackathon = await this.prisma.client.hackathon.findUnique({
      where: { id },
      include: {
        teams: {
          orderBy: { createdAt: 'asc' },
          include: {
            members: {
              orderBy: { joinedAt: 'asc' },
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!hackathon || (hackathon.status === 'DRAFT' && requesterRole !== 'ADMIN')) {
      throw new NotFoundException('Hackathon not found');
    }

    return hackathon;
  }

  create(dto: CreateHackathonDto) {
    return this.prisma.client.hackathon.create({
      data: {
        title: dto.title,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        location: dto.location,
        maxTeams: dto.maxTeams,
        maxTeamSize: dto.maxTeamSize,
      },
    });
  }

  async update(id: string, dto: UpdateHackathonDto) {
    const current = await this.prisma.client.hackathon.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } } },
    });
    if (!current) {
      throw new NotFoundException('Hackathon not found');
    }

    if (dto.status && dto.status !== current.status) {
      this.assertValidStatusTransition(current.status as HackathonStatus, dto.status, current._count.teams);
    }

    try {
      return await this.prisma.client.hackathon.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
          ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
          ...(dto.location !== undefined && { location: dto.location }),
          ...(dto.maxTeams !== undefined && { maxTeams: dto.maxTeams }),
          ...(dto.maxTeamSize !== undefined && { maxTeamSize: dto.maxTeamSize }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Hackathon not found');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const current = await this.prisma.client.hackathon.findUnique({
      where: { id },
      include: { _count: { select: { teams: true } } },
    });
    if (!current) {
      throw new NotFoundException('Hackathon not found');
    }
    if (current._count.teams > 0) {
      throw new ConflictException('This hackathon already has teams; close it instead of deleting it');
    }

    await this.prisma.client.hackathon.delete({ where: { id } });
    return { success: true };
  }

  private assertValidStatusTransition(current: HackathonStatus, next: HackathonStatus, teamCount: number) {
    if (!VALID_NEXT_STATUSES[current].includes(next)) {
      throw new ConflictException(`Cannot move a hackathon from ${current} to ${next}`);
    }
    if (current === 'PUBLISHED' && next === 'DRAFT' && teamCount > 0) {
      throw new ConflictException('Cannot un-publish a hackathon that already has teams');
    }
  }
}
