'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  Globe,
  ListChecks,
  MapPin,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  Timer,
  Users,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Hackathon } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { HackathonCard } from '@/components/HackathonCard';
import { phaseOf } from '@/lib/hackathon';

const steps = [
  { icon: Users, title: 'Join or form a team', text: 'Pick a hackathon, create a team or join one that needs you.' },
  { icon: ListChecks, title: 'Hit the milestones', text: 'Follow the schedule and tick off tasks as your team ships.' },
  { icon: Rocket, title: 'Submit your project', text: 'Share your link before the countdown ends and get seen.' },
];

const features = [
  { icon: Users, title: 'Team formation', text: 'Create a team or join one in a click. See who is on every team and who leads it.' },
  { icon: Timer, title: 'Live countdown', text: 'A real time countdown to the deadline keeps everyone focused on shipping.' },
  { icon: Calendar, title: 'Event schedule', text: 'Kickoffs, checkpoints and demos in one timeline that organizers can update.' },
  { icon: ListChecks, title: 'Task tracking', text: 'Organizers publish milestones, teams tick them off, progress is always visible.' },
  { icon: Rocket, title: 'Project submissions', text: 'Submit and update your project link until the deadline. A public gallery shows every entry.' },
  { icon: Shield, title: 'Secure accounts', text: 'Verified email sign in, session management and role based admin controls.' },
];

const previewTasks = [
  { label: 'Kickoff and team formed', done: true },
  { label: 'Prototype working end to end', done: true },
  { label: 'Record the demo video', done: false },
];

function ProductPreview() {
  return (
    <div aria-hidden className="relative mx-auto mt-16 w-full max-w-3xl text-left">
      <div className="absolute -inset-x-6 -top-6 -bottom-10 -z-10 rounded-[2rem] bg-linear-to-b from-primary/30 via-chart-4/10 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/80 shadow-2xl shadow-primary/20 backdrop-blur">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 rounded-md bg-white/5 px-3 py-0.5 text-[0.6875rem] text-muted-foreground">hackathon.app/build-a-thon-2026</span>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-5 sm:p-6">
          <div className="sm:col-span-3">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Live now</p>
            <h3 className="mt-1 text-xl font-bold">Build-a-thon 2026</h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[['02', 'Days'], ['14', 'Hours'], ['33', 'Min'], ['08', 'Sec']].map(([v, l]) => (
                <div key={l} className="rounded-lg border border-white/10 bg-white/5 py-2 text-center">
                  <div className="text-lg font-bold tabular-nums">{v}</div>
                  <div className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex -space-x-2">
              {['AK', 'BR', 'CW', 'DO'].map((i, n) => (
                <span
                  key={i}
                  className={`grid size-7 place-items-center rounded-full border-2 border-card text-[0.625rem] font-bold text-white ${['bg-primary', 'bg-chart-4', 'bg-chart-2', 'bg-chart-3'][n]}`}
                >
                  {i}
                </span>
              ))}
              <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-muted text-[0.625rem] font-semibold text-muted-foreground">+8</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <p className="text-xs font-semibold">Team tasks</p>
            <ul className="mt-3 space-y-2.5">
              {previewTasks.map((t) => (
                <li key={t.label} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded ${t.done ? 'bg-primary text-primary-foreground' : 'border border-white/20'}`}>
                    {t.done && <Check className="size-3" />}
                  </span>
                  <span className={t.done ? 'text-muted-foreground line-through' : ''}>{t.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Wait for the auth context to resolve; re-run on sign in/out so the list retries.
    if (authLoading) return;
    if (!user) {
      setHackathons(null);
      return;
    }
    let cancelled = false;
    setError(null);
    api
      .listHackathons()
      .then((items) => {
        if (!cancelled) setHackathons(items);
      })
      .catch((err) => {
        if (cancelled || (err instanceof ApiError && err.status === 401)) return;
        setError(err instanceof Error ? err.message : 'Failed to load hackathons');
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, reloadKey]);

  const teamCount = hackathons?.reduce((n, h) => n + (h._count?.teams ?? 0), 0);
  const liveCount = hackathons?.filter((h) => phaseOf(h) === 'Live').length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!hackathons) return null;
    return q ? hackathons.filter((h) => `${h.title} ${h.description} ${h.location ?? ''}`.toLowerCase().includes(q)) : hackathons;
  }, [hackathons, query]);

  return (
    <div>
      {/* Hero */}
      <section className="dark relative isolate overflow-hidden bg-background text-foreground">
        <div className="bg-grid absolute inset-0 -z-10 opacity-50" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_45%,transparent),transparent)]" />
        <div className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-24 pb-20 text-center sm:pt-32">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1 text-xs font-medium text-foreground/80">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-bold text-primary-foreground uppercase">New</span>
            Teams, tasks and submissions in one place
          </span>
          <h1 className="animate-rise mt-6 text-5xl leading-[1.05] font-extrabold tracking-tight [animation-delay:80ms] sm:text-7xl">
            Run and join hackathons <span className="text-gradient">without the chaos</span>
          </h1>
          <p className="animate-rise mt-6 max-w-2xl text-lg text-foreground/70 [animation-delay:160ms] sm:text-xl">
            Form a team, follow the schedule, track milestones and submit your project. Everything your event needs, in one clean workspace.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <Button asChild size="lg" className="h-12 rounded-lg px-7 text-base font-semibold">
              <Link href={user ? '/#hackathons' : '/sign-up'}>
                {user ? 'Browse hackathons' : 'Get started free'}
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-lg px-7 text-base font-semibold">
              <Link href="/#how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-foreground/60">
            <BadgeCheck className="size-3.5 text-chart-3" />
            Free to join. No credit card needed.
          </p>
          <ProductPreview />
        </div>
      </section>

      {/* Stats card with gradient numbers */}
      <section className="mx-auto -mt-px max-w-3xl px-6 pt-14">
        <dl className="grid grid-cols-3 divide-x overflow-hidden rounded-xl border bg-card shadow-sm">
          {[
            { label: 'Hackathons', value: hackathons?.length },
            { label: 'Live now', value: liveCount },
            { label: 'Teams', value: teamCount },
          ].map((s) => (
            <div key={s.label} className="px-4 py-6 text-center">
              <dd className="bg-linear-to-r from-primary to-chart-2 bg-clip-text text-4xl font-extrabold text-transparent tabular-nums sm:text-5xl">
                {s.value ?? 0}
              </dd>
              <dt className="mt-1 text-xs font-semibold tracking-wider uppercase">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Events */}
      <section id="hackathons" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <h2 className="text-center text-4xl font-extrabold tracking-tight text-foreground/90">Upcoming Hackathons</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Join a team, build something real, and win recognition. Find your next event below.
        </p>

        {user && (
          <div className="mx-auto mt-8 flex max-w-md items-center">
            <div className="relative w-full">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hackathons…" className="h-10 bg-card pl-9" />
            </div>
          </div>
        )}

        {!user && !authLoading && (
          <Card className="mx-auto mt-10 max-w-xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="size-8 text-muted-foreground" />
              <p className="font-semibold">Sign in to see upcoming events</p>
              <p className="max-w-sm text-sm text-muted-foreground">Events, teams and schedules live behind your free account.</p>
              <Button asChild className="mt-2">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {error && !hackathons && (
          <Card className="mx-auto mt-8 max-w-xl border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                <RefreshCw />
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {user && !hackathons && !error && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-44 rounded-none" />
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {visible?.length === 0 && (
          <p className="mt-12 text-center text-muted-foreground">{hackathons?.length ? 'No hackathons match your search.' : 'No hackathons yet. New events appear here once published.'}</p>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible?.map((h) => (
            <HackathonCard key={h.id} h={h} />
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="text-center text-sm font-semibold tracking-wide text-primary uppercase">Features</p>
          <h2 className="mt-2 text-center text-4xl font-extrabold tracking-tight">Everything a hackathon needs</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            From the first team invite to the final submission, each step has a place.
          </p>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group rounded-2xl border bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-t bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-4xl font-extrabold tracking-tight text-foreground/90">How it works</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="rounded-xl border bg-background p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm text-muted-foreground">$ 0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="dark relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-background px-8 py-16 text-center text-foreground">
          <div className="bg-grid absolute inset-0 -z-10 opacity-40" />
          <div className="absolute -top-24 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/40 blur-3xl" />
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to build something great?</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">Create your free account, join a team and ship your next project.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-lg px-7 text-base font-semibold">
              <Link href={user ? '/#hackathons' : '/sign-up'}>
                {user ? 'Find a hackathon' : 'Create free account'}
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
