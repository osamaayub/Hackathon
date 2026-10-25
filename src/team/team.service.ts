import { ConflictException, ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../lib/database/prisma.service.js';
import { isUniqueViolation, isNotFound } from '../common/prisma-errors.js';
import { parsePagination, toPaginated } from '../common/pagination.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

export const DEFAULT_MAX_TEAM_SIZE = 4;

const memberInclude = {
  members: {
    orderBy: { joinedAt: 'asc' as const },
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

interface ActingUser {
  id: string;
  role: string;
}

@Injectable()
export class TeamService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByHackathon(hackathonId: string, page?: string, pageSize?: string) {
    const pagination = parsePagination(page, pageSize);
    const where = { hackathonId };

    const [items, total] = await Promise.all([
      this.prisma.client.team.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: memberInclude,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.client.team.count({ where }),
    ]);

    return toPaginated(items, total, pagination);
  }

  async findOne(id: string) {
    const team = await this.prisma.client.team.findUnique({
      where: { id },
      include: memberInclude,
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async create(userId: string, dto: CreateTeamDto) {
    return this.prisma.client.$transaction(async (tx) => {
      const hackathon = await tx.hackathon.findUnique({ where: { id: dto.hackathonId } });
      if (!hackathon) {
        throw new NotFoundException('Hackathon not found');
      }
      if (hackathon.status !== 'PUBLISHED') {
        throw new ForbiddenException('This hackathon is not open for team creation');
      }

      // Lock the hackathon row so a concurrent team creation can't both pass the maxTeams check.
      await tx.$queryRaw`SELECT id FROM "hackathon" WHERE id = ${hackathon.id} FOR UPDATE`;

      if (hackathon.maxTeams != null) {
        const teamCount = await tx.team.count({ where: { hackathonId: hackathon.id } });
        if (teamCount >= hackathon.maxTeams) {
          throw new ConflictException('This hackathon has reached its maximum number of teams');
        }
      }

      // The database only blocks an exact match, so "Team Alpha" and "team alpha" need this check.
      const sameName = await tx.team.findFirst({
        where: { hackathonId: hackathon.id, name: { equals: dto.name.trim(), mode: 'insensitive' } },
        select: { id: true },
      });
      if (sameName) {
        throw new ConflictException('A team with this name already exists for this hackathon');
      }

      try {
        return await tx.team.create({
          data: {
            name: dto.name,
            description: dto.description,
            hackathonId: hackathon.id,
            members: {
              create: { userId, hackathonId: hackathon.id, role: 'LEADER' },
            },
          },
          include: memberInclude,
        });
      } catch (error) {
        if (isUniqueViolation(error, 'hackathonId_userId')) {
          throw new ConflictException('You are already in a team for this hackathon');
        }
        if (isUniqueViolation(error, 'hackathonId_name')) {
          throw new ConflictException('A team with this name already exists for this hackathon');
        }
        throw error;
      }
    });
  }

  async update(teamId: string, actingUser: ActingUser, dto: UpdateTeamDto) {
    await this.assertCanManage(teamId, actingUser);

    try {
      return await this.prisma.client.team.update({
        where: { id: teamId },
        data: dto,
        include: memberInclude,
      });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Team not found');
      }
      if (isUniqueViolation(error, 'hackathonId_name')) {
        throw new ConflictException('A team with this name already exists for this hackathon');
      }
      throw error;
    }
  }

  async remove(teamId: string, actingUser: ActingUser) {
    await this.assertCanManage(teamId, actingUser);

    try {
      await this.prisma.client.team.delete({ where: { id: teamId } });
    } catch (error) {
      if (isNotFound(error)) {
        throw new NotFoundException('Team not found');
      }
      throw error;
    }

    return { success: true };
  }

  async join(teamId: string, userId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      // Lock the team row so two concurrent joins can't both read "one slot left".
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "team" WHERE id = ${teamId} FOR UPDATE`;
      if (locked.length === 0) {
        throw new NotFoundException('Team not found');
      }

      const team = await tx.team.findUnique({
        where: { id: teamId },
        include: { hackathon: { select: { maxTeamSize: true } } },
      });
      if (!team) {
        throw new NotFoundException('Team not found');
      }

      const memberCount = await tx.teamMember.count({ where: { teamId } });
      const effectiveMax = team.hackathon.maxTeamSize ?? DEFAULT_MAX_TEAM_SIZE;
      if (memberCount >= effectiveMax) {
        throw new ConflictException('This team is full');
      }

      try {
        await tx.teamMember.create({
          data: { teamId, userId, hackathonId: team.hackathonId, role: 'MEMBER' },
        });
      } catch (error) {
        if (isUniqueViolation(error, 'hackathonId_userId')) {
          throw new ConflictException('You are already in a team for this hackathon');
        }
        if (isUniqueViolation(error, 'teamId_userId')) {
          throw new ConflictException('Already a member of this team');
        }
        throw error;
      }

      return tx.team.findUnique({ where: { id: teamId }, include: memberInclude });
    });
  }

  async leave(teamId: string, userId: string) {
    return this.prisma.client.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "team" WHERE id = ${teamId} FOR UPDATE`;
      if (locked.length === 0) {
        throw new NotFoundException('Team not found');
      }

      const membership = await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } });
      if (!membership) {
        throw new NotFoundException('Not a member of this team');
      }

      await tx.teamMember.delete({ where: { id: membership.id } });

      return this.handleDepartureSideEffects(tx, teamId, membership.role);
    });
  }

  async removeMember(teamId: string, targetUserId: string, actingUser: ActingUser) {
    return this.prisma.client.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "team" WHERE id = ${teamId} FOR UPDATE`;
      if (locked.length === 0) {
        throw new NotFoundException('Team not found');
      }

      const actingMembership = await tx.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: actingUser.id } },
      });
      const isLeader = actingMembership?.role === 'LEADER';
      if (!isLeader && actingUser.role !== 'ADMIN') {
        throw new ForbiddenException('Only the team leader or an admin can remove a member');
      }

      const target = await tx.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: targetUserId } } });
      if (!target) {
        throw new NotFoundException('That user is not a member of this team');
      }

      await tx.teamMember.delete({ where: { id: target.id } });

      return this.handleDepartureSideEffects(tx, teamId, target.role);
    });
  }

  /** Shared post-departure logic for leave() and removeMember(): delete an emptied team, else succeed the leader. */
  private async handleDepartureSideEffects(
    tx: Prisma.TransactionClient,
    teamId: string,
    departedRole: string,
  ) {
    const remaining = await tx.teamMember.findMany({ where: { teamId }, orderBy: { joinedAt: 'asc' } });

    if (remaining.length === 0) {
      await tx.team.delete({ where: { id: teamId } });
      return { success: true, teamDeleted: true };
    }

    if (departedRole === 'LEADER') {
      await tx.teamMember.update({ where: { id: remaining[0].id }, data: { role: 'LEADER' } });
    }

    return { success: true, teamDeleted: false };
  }

  private async assertCanManage(teamId: string, actingUser: ActingUser) {
    if (actingUser.role === 'ADMIN') return;

    const membership = await this.prisma.client.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: actingUser.id } },
    });
    if (membership?.role !== 'LEADER') {
      throw new ForbiddenException('Only the team leader or an admin can do this');
    }
  }
}
