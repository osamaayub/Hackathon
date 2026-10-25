'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Hackathon, Submission, Team, TeamRole } from './types';

export interface HackathonEntry {
  hackathon: Hackathon;
  team: Team;
  role: TeamRole;
  joinedAt: string;
  submission: Submission | null;
  tasksDone: number;
  tasksTotal: number;
}

export interface ActivityStats {
  events: number;
  led: number;
  submissions: number;
  described: number;
  tasksDone: number;
  collaborators: number;
  bestTeamSize: number;
}

export const emptyStats: ActivityStats = {
  events: 0,
  led: 0,
  submissions: 0,
  described: 0,
  tasksDone: 0,
  collaborators: 0,
  bestTeamSize: 0,
};

export function statsOf(entries: HackathonEntry[], userId: string): ActivityStats {
  const mates = new Set<string>();
  for (const e of entries) for (const m of e.team.members) if (m.userId !== userId) mates.add(m.userId);
  return {
    events: entries.length,
    led: entries.filter((e) => e.role === 'LEADER').length,
    submissions: entries.filter((e) => e.submission).length,
    described: entries.filter((e) => e.submission?.description?.trim()).length,
    tasksDone: entries.reduce((n, e) => n + e.tasksDone, 0),
    collaborators: mates.size,
    bestTeamSize: entries.reduce((n, e) => Math.max(n, e.team.members.length), 0),
  };
}

/**
 * Collects everything the profile shows about the user's hackathons: the team they are on,
 * their role, the team's submission and task progress. Best effort: a failing request for one
 * hackathon just leaves it out instead of breaking the page.
 */
export function useProfileActivity(userId: string | undefined) {
  const [entries, setEntries] = useState<HackathonEntry[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const hackathons = await api.listHackathons();
        const details = await Promise.all(hackathons.map((h) => api.getHackathon(h.id).catch(() => null)));

        const found = await Promise.all(
          details.map(async (d): Promise<HackathonEntry | null> => {
            const team = d?.teams.find((t) => t.members.some((m) => m.userId === userId));
            const me = team?.members.find((m) => m.userId === userId);
            if (!d || !team || !me) return null;

            const [subs, tasks] = await Promise.all([
              api.listSubmissions(d.id).catch(() => []),
              api.listTasks(d.id).catch(() => []),
            ]);

            return {
              hackathon: d,
              team,
              role: me.role,
              joinedAt: me.joinedAt,
              submission: subs.find((s) => s.teamId === team.id)?.submission ?? null,
              tasksDone: tasks.filter((t) => t.completedByMyTeam).length,
              tasksTotal: tasks.length,
            };
          }),
        );

        if (!cancelled) {
          setEntries(
            found
              .filter((e): e is HackathonEntry => e !== null)
              .sort((a, b) => new Date(b.hackathon.startDate).getTime() - new Date(a.hackathon.startDate).getTime()),
          );
        }
      } catch {
        if (!cancelled) setEntries([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return entries;
}
