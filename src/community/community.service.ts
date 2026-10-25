import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/database/prisma.service.js';
import { CacheService } from '../lib/cache/cache.service.js';

const LEADERBOARD_KEY = 'leaderboard';
const PROJECTS_KEY = 'projects';
// Short enough that changes show up quickly, long enough that most requests never touch the database.
// The scheduled warm up job refreshes both before they expire.
const LEADERBOARD_TTL_SECONDS = 300;
const PROJECTS_TTL_SECONDS = 120;

export interface LeaderboardRow {
  id: string;
  name: string;
  events: number;
  led: number;
  submissions: number;
  points: number;
}

@Injectable()
export class CommunityService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CacheService) private readonly cache: CacheService,
  ) {}

  getLeaderboard() {
    return this.cache.wrap(LEADERBOARD_KEY, LEADERBOARD_TTL_SECONDS, () => this.computeLeaderboard());
  }

  getProjects() {
    return this.cache.wrap(PROJECTS_KEY, PROJECTS_TTL_SECONDS, () => this.computeProjects());
  }

  /** Recomputes both and stores them, used by the scheduled warm up job. */
  async refresh() {
    const [leaderboard, projects] = await Promise.all([this.computeLeaderboard(), this.computeProjects()]);
    await Promise.all([
      this.cache.set(LEADERBOARD_KEY, leaderboard, LEADERBOARD_TTL_SECONDS),
      this.cache.set(PROJECTS_KEY, projects, PROJECTS_TTL_SECONDS),
    ]);
    return { leaderboardRows: leaderboard.length, projects: projects.projects.length };
  }

  /** Drops the cached copies so the next request sees fresh data. */
  invalidate() {
    return this.cache.del(LEADERBOARD_KEY, PROJECTS_KEY);
  }

  /** Points: 50 per event joined, 25 per team led, 100 per project submitted. */
  private async computeLeaderboard(): Promise<LeaderboardRow[]> {
    const members = await this.prisma.client.teamMember.findMany({
      where: { team: { hackathon: { status: { not: 'DRAFT' } } } },
      select: {
        role: true,
        user: { select: { id: true, name: true, email: true } },
        team: { select: { submission: { select: { id: true } } } },
      },
    });

    const rows = new Map<string, LeaderboardRow>();
    for (const m of members) {
      const row =
        rows.get(m.user.id) ??
        // Only the part of the email before the @ is shown, never the full address.
        { id: m.user.id, name: m.user.name?.trim() || m.user.email.split('@')[0], events: 0, led: 0, submissions: 0, points: 0 };
      row.events += 1;
      if (m.role === 'LEADER') row.led += 1;
      if (m.team.submission) row.submissions += 1;
      rows.set(m.user.id, row);
    }

    for (const r of rows.values()) r.points = r.events * 50 + r.led * 25 + r.submissions * 100;
    return [...rows.values()].sort((a, b) => b.points - a.points || b.events - a.events || a.name.localeCompare(b.name));
  }

  private async computeProjects() {
    const [hackathons, submissions] = await Promise.all([
      this.prisma.client.hackathon.findMany({
        where: { status: { not: 'DRAFT' } },
        select: { id: true, title: true },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.client.submission.findMany({
        where: { team: { hackathon: { status: { not: 'DRAFT' } } } },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          teamId: true,
          link: true,
          description: true,
          submittedAt: true,
          updatedAt: true,
          team: { select: { name: true, hackathon: { select: { id: true, title: true } } } },
        },
      }),
    ]);

    return {
      hackathons,
      projects: submissions.map((s) => ({
        hackathon: s.team.hackathon,
        teamId: s.teamId,
        teamName: s.team.name,
        submission: {
          id: s.id,
          teamId: s.teamId,
          link: s.link,
          description: s.description,
          submittedAt: s.submittedAt,
          updatedAt: s.updatedAt,
        },
      })),
    };
  }
}
