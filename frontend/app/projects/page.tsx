'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RefreshCw, Rocket, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/hackathon';
import { useProjects } from '@/lib/use-community-data';
import { AuthGate } from '@/components/AuthGate';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const accents = [
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

function hostOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
}

function Gallery() {
  const { user } = useAuth();
  const [retry, setRetry] = useState(0);
  const { data, error } = useProjects(user?.id, retry);
  const [query, setQuery] = useState('');
  const [hackathonId, setHackathonId] = useState('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.projects ?? []).filter(
      (p) =>
        (hackathonId === 'all' || p.hackathon.id === hackathonId) &&
        (!q || `${p.teamName} ${p.hackathon.title} ${p.submission.description ?? ''} ${p.submission.link}`.toLowerCase().includes(q)),
    );
  }, [data, query, hackathonId]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `${visible.length} of ${data.projects.length} project${data.projects.length === 1 ? '' : 's'}` : 'Loading projects…'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" className="h-10 bg-card pl-9" aria-label="Search projects" />
          </div>
          <select
            value={hackathonId}
            onChange={(e) => setHackathonId(e.target.value)}
            aria-label="Filter by hackathon"
            className="h-10 rounded-lg border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="all">All hackathons</option>
            {data?.hackathons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && !data ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setRetry((k) => k + 1)}>
            <RefreshCw /> Try again
          </Button>
        </div>
      ) : !data ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Rocket className="size-6" />
          </span>
          <p className="font-semibold">No projects found</p>
          <p className="text-sm text-muted-foreground">Try a different search or hackathon.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <article key={p.teamId} className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className={`h-1.5 bg-linear-to-r ${accents[i % accents.length]}`} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-sm font-bold text-white ${accents[i % accents.length]}`}>
                    {p.teamName.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{p.teamName}</h3>
                    <Link href={`/hackathons/${p.hackathon.id}`} className="block truncate text-xs text-muted-foreground hover:text-primary">
                      {p.hackathon.title}
                    </Link>
                  </div>
                </div>
                <p className="mt-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.submission.description || 'No description provided.'}</p>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <p className="truncate">{hostOf(p.submission.link)}</p>
                    <p>{formatDate(p.submission.submittedAt)}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={p.submission.link} target="_blank" rel="noopener noreferrer">
                      View <ExternalLink />
                    </a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <>
      <PageHero eyebrow="Projects" title={<>What the community <span className="text-gradient">built</span></>} description="Every project submitted to every hackathon, in one place. Get inspired, then go build your own." />
      <AuthGate what="projects">
        <Gallery />
      </AuthGate>
    </>
  );
}
