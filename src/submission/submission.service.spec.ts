import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubmissionService } from './submission.service.js';

function makeFakeClient() {
  const team = { findUnique: vi.fn() };
  const teamMember = { findUnique: vi.fn() };
  const submission = { findUnique: vi.fn(), upsert: vi.fn() };
  return { client: { team, teamMember, submission }, team, teamMember, submission };
}

describe('SubmissionService', () => {
  describe('upsert', () => {
    it('rejects a caller who is not a member of the team', async () => {
      const { client, team, teamMember } = makeFakeClient();
      team.findUnique.mockResolvedValue({ id: 't1', hackathon: { endDate: new Date('2099-01-01') } });
      teamMember.findUnique.mockResolvedValue(null);

      const service = new SubmissionService({ client } as any, { del: vi.fn() } as any);
      await expect(service.upsert('t1', 'u1', { link: 'https://x.dev' })).rejects.toThrow(ForbiddenException);
    });

    it('rejects once the hackathon deadline has passed', async () => {
      const { client, team, teamMember } = makeFakeClient();
      team.findUnique.mockResolvedValue({ id: 't1', hackathon: { endDate: new Date('2000-01-01') } });
      teamMember.findUnique.mockResolvedValue({ id: 'm1' });

      const service = new SubmissionService({ client } as any, { del: vi.fn() } as any);
      await expect(service.upsert('t1', 'u1', { link: 'https://x.dev' })).rejects.toThrow(ConflictException);
    });

    it('upserts the submission for a member before the deadline', async () => {
      const { client, team, teamMember, submission } = makeFakeClient();
      team.findUnique.mockResolvedValue({ id: 't1', hackathon: { endDate: new Date('2099-01-01') } });
      teamMember.findUnique.mockResolvedValue({ id: 'm1' });
      submission.upsert.mockResolvedValue({ teamId: 't1', link: 'https://x.dev' });

      const service = new SubmissionService({ client } as any, { del: vi.fn() } as any);
      const result = await service.upsert('t1', 'u1', { link: 'https://x.dev' });
      expect(result.link).toBe('https://x.dev');
    });
  });

  describe('getByTeam', () => {
    it('throws NotFoundException for a missing team', async () => {
      const { client, team } = makeFakeClient();
      team.findUnique.mockResolvedValue(null);

      const service = new SubmissionService({ client } as any, { del: vi.fn() } as any);
      await expect(service.getByTeam('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
