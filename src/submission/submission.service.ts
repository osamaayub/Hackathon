import { ConflictException, ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../lib/database/prisma.service.js';
import { parsePagination, toPaginated } from '../common/pagination.js';
import { UpsertSubmissionDto } from './dto/upsert-submission.dto.js';

@Injectable()
export class SubmissionService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getByTeam(teamId: string) {
    const team = await this.prisma.client.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return this.prisma.client.submission.findUnique({ where: { teamId } });
  }

  async upsert(teamId: string, userId: string, dto: UpsertSubmissionDto) {
    const team = await this.prisma.client.team.findUnique({
      where: { id: teamId },
      include: { hackathon: { select: { endDate: true } } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const membership = await this.prisma.client.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) {
      throw new ForbiddenException('Only a member of this team can submit for it');
    }

    if (new Date() > team.hackathon.endDate) {
      throw new ConflictException('The submission deadline for this hackathon has passed');
    }

    return this.prisma.client.submission.upsert({
      where: { teamId },
      create: { teamId, link: dto.link, description: dto.description },
      update: { link: dto.link, description: dto.description },
    });
  }

  async listByHackathon(hackathonId: string, requesterRole: string, page?: string, pageSize?: string) {
    const hackathon = await this.prisma.client.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon || (hackathon.status === 'DRAFT' && requesterRole !== 'ADMIN')) {
      throw new NotFoundException('Hackathon not found');
    }

    const pagination = parsePagination(page, pageSize);
    const where = { hackathonId };

    const [items, total] = await Promise.all([
      this.prisma.client.team.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: { submission: true },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.client.team.count({ where }),
    ]);

    return toPaginated(
      items.map((t) => ({ teamId: t.id, teamName: t.name, submission: t.submission })),
      total,
      pagination,
    );
  }
}
