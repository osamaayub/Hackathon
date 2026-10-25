'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Hackathon, HackathonDetail, Submission } from './types';

export interface ProjectEntry {
  hackathon: Hackathon;
  teamId: string;
  teamName: string;
  submission: Submission;
}

export interface CommunityData {
  hackathons: HackathonDetail[];
  projects: ProjectEntry[];
}

export interface LeaderboardRow {
  id: string;
  name: string | null;
  email: string;
  events: number;
  led: number;
  submissions: number;
  points: number;
}

// One shared request per signed in user, so moving between the projects and
// leaderboard pages does not refetch everything.
let cached: { userId: string; promise: Promise<CommunityData> } | null = null;

async function loadAll(): Promise<CommunityData> {
  const list = await api.listHackathons();
  const details = (await Promise.all(list.map((h) => api.getHackathon(h.id).catch(() => null)))).filter(
    (d): d is HackathonDetail => d !== null,
  );

  const projects: ProjectEntry[] = [];
  await Promise.all(
    details.map(async (d) => {
      const subs = await api.listSubmissions(d.id).catch(() => []);
      for (const s of subs) {
        if (s.submission) projects.push({ hackathon: d, teamId: s.teamId, teamName: s.teamName, submission: s.submission });
      }
    }),
  );
  projects.sort((a, b) => new Date(b.submission.submittedAt).getTime() - new Date(a.submission.submittedAt).getTime());

  return { hackathons: details, projects };
}

export function useCommunityData(userId: string | undefined, retryKey = 0) {
  const [data, setData] = useState<CommunityData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setError(null);

    if (!cached || cached.userId !== userId || retryKey > 0) {
      cached = { userId, promise: loadAll() };
    }
    cached.promise
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        cached = null;
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load data');
      });

    return () => {
      cancelled = true;
    };
  }, [userId, retryKey]);

  return { data, error };
}

/** Points: 50 per event joined, 25 per team led, 100 per submitted project. */
export function buildLeaderboard(data: CommunityData): LeaderboardRow[] {
  const submitted = new Set(data.projects.map((p) => p.teamId));
  const rows = new Map<string, LeaderboardRow>();

  for (const h of data.hackathons) {
    for (const team of h.teams) {
      for (const m of team.members) {
        const row =
          rows.get(m.userId) ??
          { id: m.userId, name: m.user.name, email: m.user.email, events: 0, led: 0, submissions: 0, points: 0 };
        row.events += 1;
        if (m.role === 'LEADER') row.led += 1;
        if (submitted.has(team.id)) row.submissions += 1;
        rows.set(m.userId, row);
      }
    }
  }

  for (const r of rows.values()) r.points = r.events * 50 + r.led * 25 + r.submissions * 100;
  return [...rows.values()].sort((a, b) => b.points - a.points || b.events - a.events || (a.name ?? a.email).localeCompare(b.name ?? b.email));
}
