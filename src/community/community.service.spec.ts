import { CacheService } from '../lib/cache/cache.service.js';
import { CommunityService } from './community.service.js';

function member(id: string, name: string | null, email: string, role: 'LEADER' | 'MEMBER', submitted: boolean) {
  return { role, user: { id, name, email }, team: { submission: submitted ? { id: `s-${id}` } : null } };
}

function makeService(members: ReturnType<typeof member>[]) {
  const teamMember = { findMany: vi.fn().mockResolvedValue(members) };
  const hackathon = { findMany: vi.fn().mockResolvedValue([{ id: 'h1', title: 'Event' }]) };
  const submission = { findMany: vi.fn().mockResolvedValue([]) };
  const cache = new CacheService(null);
  const service = new CommunityService({ client: { teamMember, hackathon, submission } } as any, cache);
  return { service, teamMember, cache };
}

describe('CommunityService.getLeaderboard', () => {
  it('scores 50 per event, 25 per team led and 100 per submitted project, highest first', async () => {
    const { service } = makeService([
      member('u1', 'Ada Lovelace', 'ada@example.com', 'LEADER', true), // 50 + 25 + 100 = 175
      member('u1', 'Ada Lovelace', 'ada@example.com', 'MEMBER', false), // + 50 = 225
      member('u2', 'Grace Hopper', 'grace@example.com', 'MEMBER', true), // 50 + 100 = 150
      member('u3', null, 'linus@example.com', 'MEMBER', false), // 50
    ]);

    const rows = await service.getLeaderboard();
    expect(rows.map((r) => [r.name, r.points])).toEqual([
      ['Ada Lovelace', 225],
      ['Grace Hopper', 150],
      ['linus', 50],
    ]);
    expect(rows[0]).toMatchObject({ events: 2, led: 1, submissions: 1 });
  });

  it('never exposes full email addresses', async () => {
    const { service } = makeService([member('u3', null, 'linus@example.com', 'MEMBER', false)]);
    const rows = await service.getLeaderboard();
    expect(JSON.stringify(rows)).not.toContain('example.com');
  });

  it('only queries the database once while the result is cached, and again after invalidate()', async () => {
    const { service, teamMember } = makeService([member('u1', 'Ada', 'ada@example.com', 'LEADER', false)]);
    await service.getLeaderboard();
    await service.getLeaderboard();
    expect(teamMember.findMany).toHaveBeenCalledTimes(1);

    await service.invalidate();
    await service.getLeaderboard();
    expect(teamMember.findMany).toHaveBeenCalledTimes(2);
  });

  it('excludes draft hackathons', async () => {
    const { service, teamMember } = makeService([]);
    await service.getLeaderboard();
    expect(teamMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { team: { hackathon: { status: { not: 'DRAFT' } } } } }),
    );
  });
});
