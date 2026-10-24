import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { TeamService, DEFAULT_MAX_TEAM_SIZE } from './team.service.js';

function uniqueViolation(constraint: string) {
  return new Prisma.PrismaClientKnownRequestError(
    `Unique constraint failed on the constraint: \`${constraint}\``,
    { code: 'P2002', clientVersion: '7.10.1', meta: {} },
  );
}

function makeFakeClient(overrides: Record<string, unknown> = {}) {
  const txHandlers = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: 'team-1' }]),
    team: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
      delete: vi.fn(),
    },
    hackathon: {
      findUnique: vi.fn(),
    },
    ...overrides,
  };

  return {
    client: {
      ...txHandlers,
      $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(txHandlers)),
    },
    tx: txHandlers,
  };
}

describe('TeamService', () => {
  describe('join', () => {
    it('rejects when the team is already at its effective capacity', async () => {
      const { client, tx } = makeFakeClient();
      (tx.team.findUnique as any).mockResolvedValue({
        id: 'team-1',
        hackathonId: 'hack-1',
        hackathon: { maxTeamSize: null },
      });
      (tx.teamMember.count as any).mockResolvedValue(DEFAULT_MAX_TEAM_SIZE);

      const service = new TeamService({ client } as any);
      await expect(service.join('team-1', 'user-1')).rejects.toThrow(ConflictException);
      expect(tx.teamMember.create).not.toHaveBeenCalled();
    });

    it('rejects when the user already belongs to a team in this hackathon', async () => {
      const { client, tx } = makeFakeClient();
      (tx.team.findUnique as any).mockResolvedValue({
        id: 'team-1',
        hackathonId: 'hack-1',
        hackathon: { maxTeamSize: null },
      });
      (tx.teamMember.count as any).mockResolvedValue(1);
      (tx.teamMember.create as any).mockRejectedValue(uniqueViolation('team_member_hackathonId_userId_key'));

      const service = new TeamService({ client } as any);
      await expect(service.join('team-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when the team row lock finds nothing', async () => {
      const { client, tx } = makeFakeClient();
      (tx.$queryRaw as any).mockResolvedValue([]);

      const service = new TeamService({ client } as any);
      await expect(service.join('missing-team', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('leave', () => {
    it('promotes the longest-tenured remaining member when the leader leaves', async () => {
      const { client, tx } = makeFakeClient();
      (tx.teamMember.findUnique as any).mockResolvedValue({ id: 'm-1', role: 'LEADER' });
      (tx.teamMember.findMany as any).mockResolvedValue([
        { id: 'm-2', joinedAt: new Date('2026-01-01') },
        { id: 'm-3', joinedAt: new Date('2026-01-02') },
      ]);

      const service = new TeamService({ client } as any);
      const result = await service.leave('team-1', 'user-1');

      expect(tx.teamMember.update).toHaveBeenCalledWith({ where: { id: 'm-2' }, data: { role: 'LEADER' } });
      expect(result).toEqual({ success: true, teamDeleted: false });
    });

    it('deletes the team when the last member leaves', async () => {
      const { client, tx } = makeFakeClient();
      (tx.teamMember.findUnique as any).mockResolvedValue({ id: 'm-1', role: 'LEADER' });
      (tx.teamMember.findMany as any).mockResolvedValue([]);

      const service = new TeamService({ client } as any);
      const result = await service.leave('team-1', 'user-1');

      expect(tx.team.delete).toHaveBeenCalledWith({ where: { id: 'team-1' } });
      expect(result).toEqual({ success: true, teamDeleted: true });
    });

    it('throws NotFoundException when the caller is not a member', async () => {
      const { client, tx } = makeFakeClient();
      (tx.teamMember.findUnique as any).mockResolvedValue(null);

      const service = new TeamService({ client } as any);
      await expect(service.leave('team-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('rejects when the acting user is neither the leader nor an admin', async () => {
      const { client, tx } = makeFakeClient();
      (tx.teamMember.findUnique as any).mockResolvedValue({ id: 'm-1', role: 'MEMBER' });

      const service = new TeamService({ client } as any);
      await expect(
        service.removeMember('team-1', 'target-user', { id: 'user-1', role: 'PARTICIPANT' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an admin even without team membership', async () => {
      const { client, tx } = makeFakeClient();
      (tx.teamMember.findUnique as any)
        .mockResolvedValueOnce(null) // acting user's own membership lookup
        .mockResolvedValueOnce({ id: 'target-m', role: 'MEMBER' }); // target membership
      (tx.teamMember.findMany as any).mockResolvedValue([{ id: 'other', joinedAt: new Date() }]);

      const service = new TeamService({ client } as any);
      const result = await service.removeMember('team-1', 'target-user', { id: 'admin-1', role: 'ADMIN' });

      expect(tx.teamMember.delete).toHaveBeenCalledWith({ where: { id: 'target-m' } });
      expect(result.success).toBe(true);
    });
  });

  describe('create', () => {
    it('rejects creating a team in a hackathon that is not PUBLISHED', async () => {
      const { client, tx } = makeFakeClient();
      (tx.hackathon.findUnique as any).mockResolvedValue({ id: 'hack-1', status: 'DRAFT', maxTeams: null });

      const service = new TeamService({ client } as any);
      await expect(
        service.create('user-1', { hackathonId: 'hack-1', name: 'Team X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the hackathon already has its maximum number of teams', async () => {
      const { client, tx } = makeFakeClient();
      (tx.hackathon.findUnique as any).mockResolvedValue({ id: 'hack-1', status: 'PUBLISHED', maxTeams: 2 });
      (tx.team.count as any).mockResolvedValue(2);

      const service = new TeamService({ client } as any);
      await expect(
        service.create('user-1', { hackathonId: 'hack-1', name: 'Team X' }),
      ).rejects.toThrow(ConflictException);
      expect(tx.team.create).not.toHaveBeenCalled();
    });
  });
});
