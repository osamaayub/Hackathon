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

/** Loads everything the profile shows about the user's hackathons with a single request. */
export function useProfileActivity(userId: string | undefined) {
  const [entries, setEntries] = useState<HackathonEntry[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .myActivity()
      .then((items) => {
        if (!cancelled) setEntries(items);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return entries;
}
