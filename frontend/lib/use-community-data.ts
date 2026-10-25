'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import type { Submission } from './types';

export interface ProjectEntry {
  hackathon: { id: string; title: string };
  teamId: string;
  teamName: string;
  submission: Submission;
}

export interface ProjectsData {
  hackathons: { id: string; title: string }[];
  projects: ProjectEntry[];
}

export interface LeaderboardRow {
  id: string;
  name: string;
  events: number;
  led: number;
  submissions: number;
  points: number;
}

/** Small hook: runs a loader once per signed in user and exposes the result, an error and a retry counter. */
function useLoad<T>(userId: string | undefined, load: () => Promise<T>, retryKey: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setError(null);
    load()
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load data'));
    return () => {
      cancelled = true;
    };
    // `load` is a stable module level function, so it is deliberately not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, retryKey]);

  return { data, error };
}

/** Every submitted project, in one request. The backend caches it, so it is fast for everyone. */
export function useProjects(userId: string | undefined, retryKey = 0) {
  return useLoad<ProjectsData>(userId, api.projects, retryKey);
}

/** The ranking of participants, in one request. */
export function useLeaderboard(userId: string | undefined, retryKey = 0) {
  return useLoad<LeaderboardRow[]>(userId, api.leaderboard, retryKey);
}
