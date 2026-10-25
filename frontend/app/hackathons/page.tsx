'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { phaseOf, type Phase } from '@/lib/hackathon';
import type { Hackathon } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { AuthGate } from '@/components/AuthGate';
import { HackathonCard } from '@/components/HackathonCard';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type Filter = 'All' | Phase;
type Sort = 'soonest' | 'newest' | 'teams';

const filters: { value: Filter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Live', label: 'Live' },
  { value: 'Register', label: 'Upcoming' },
  { value: 'Finished', label: 'Finished' },
];

function Listing() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('All');
  const [sort, setSort] = useState<Sort>('soonest');
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    api
      .listHackathons()
      .then((items) => !cancelled && setHackathons(items))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load hackathons'));
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { All: 0, Live: 0, Register: 0, Finished: 0 };
    for (const h of hackathons ?? []) {
      c.All += 1;
      c[phaseOf(h)] += 1;
    }
    return c;
  }, [hackathons]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (hackathons ?? []).filter(
      (h) => (filter === 'All' || phaseOf(h) === filter) && (!q || `${h.title} ${h.description} ${h.location ?? ''}`.toLowerCase().includes(q)),
    );
    const time = (iso: string) => new Date(iso).getTime();
    return list.sort((a, b) => {
      if (sort === 'teams') return (b._count?.teams ?? 0) - (a._count?.teams ?? 0);
      if (sort === 'newest') return time(b.startDate) - time(a.startDate);
      // soonest: live and upcoming first by start date, finished events last
      const rank = (h: Hackathon) => (phaseOf(h) === 'Finished' ? 1 : 0);
      return rank(a) - rank(b) || (rank(a) === 0 ? time(a.startDate) - time(b.startDate) : time(b.startDate) - time(a.startDate));
    });
  }, [hackathons, filter, sort, query]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === f.value ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-xs tabular-nums ${filter === f.value ? 'bg-white/20' : 'bg-muted'}`}>{counts[f.value]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…" className="h-10 bg-card pl-9" aria-label="Search hackathons" />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort hackathons"
            className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="soonest">Soonest first</option>
            <option value="newest">Newest first</option>
            <option value="teams">Most teams</option>
          </select>
        </div>
      </div>

      {error && !hackathons ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw /> Try again
          </Button>
        </div>
      ) : !hackathons ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">No hackathons match your filters.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((h) => (
            <HackathonCard key={h.id} h={h} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HackathonsPage() {
  return (
    <>
      <PageHero eyebrow="Hackathons" title={<>Find your next <span className="text-gradient">hackathon</span></>} description="Live, upcoming and past events. Join a team, build something real, and get seen." />
      <AuthGate what="hackathons">
        <Listing />
      </AuthGate>
    </>
  );
}
