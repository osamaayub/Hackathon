'use client';

import { useMemo, useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Crown,
  ExternalLink,
  Flame,
  Handshake,
  ListChecks,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Medal,
  Rocket,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { dateRange, formatDate, phaseOf, type Phase } from '@/lib/hackathon';
import { emptyStats, statsOf, useProfileActivity, type HackathonEntry } from '@/lib/use-profile-activity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const LEVELS = [
  { name: 'Novice', min: 0 },
  { name: 'Contributor', min: 200 },
  { name: 'Builder', min: 500 },
  { name: 'Champion', min: 1000 },
];

const phaseStyle: Record<Phase, string> = {
  Live: 'bg-chart-3/15 text-chart-3',
  Register: 'bg-primary/10 text-primary',
  Finished: 'bg-muted text-muted-foreground',
};

/** Four axis radar chart (Technical / Business / Creativity / Leadership). */
function Radar({ values }: { values: { technical: number; business: number; creativity: number; leadership: number } }) {
  const c = 110;
  const r = 70;
  const pt = (angle: number, v: number) => [c + Math.cos(angle) * r * v, c + Math.sin(angle) * r * v];
  const axes = [
    { angle: -Math.PI / 2, v: values.technical },
    { angle: 0, v: values.business },
    { angle: Math.PI / 2, v: values.creativity },
    { angle: Math.PI, v: values.leadership },
  ];
  const poly = axes.map((a) => pt(a.angle, Math.max(a.v, 0.04)).join(',')).join(' ');
  return (
    <svg viewBox="0 0 220 220" className="mx-auto size-full max-w-60" role="img" aria-label="Skills radar chart">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon key={ring} points={axes.map((a) => pt(a.angle, ring).join(',')).join(' ')} fill="none" className="stroke-border" strokeWidth="1" />
      ))}
      {axes.map((a) => (
        <line key={a.angle} x1={c} y1={c} x2={pt(a.angle, 1)[0]} y2={pt(a.angle, 1)[1]} className="stroke-border" />
      ))}
      <polygon points={poly} className="fill-primary/25 stroke-primary" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={c} cy={c} r="3" className="fill-primary" />
      <g className="fill-muted-foreground text-[10px]" textAnchor="middle">
        <text x={c} y="22">Technical</text>
        <text x="196" y={c + 4}>Business</text>
        <text x={c} y="210">Creativity</text>
        <text x="26" y={c + 4}>Leadership</text>
      </g>
    </svg>
  );
}

function StatTile({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <span className={`grid size-9 place-items-center rounded-lg ${accent}`}>
        <Icon className="size-4.5" />
      </span>
      <p className="mt-3 text-2xl font-extrabold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EntryCard({ entry }: { entry: HackathonEntry }) {
  const { hackathon: h, team, role, submission, tasksDone, tasksTotal } = entry;
  const phase = phaseOf(h);
  const pct = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  return (
    <Card className="gap-0 rounded-xl py-0 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold tracking-tight">{h.title}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${phaseStyle[phase]}`}>{phase}</span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {dateRange(h.startDate, h.endDate)}
            </span>
            {h.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {h.location}
              </span>
            )}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/hackathons/${h.id}`}>
            Open <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Team</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-semibold">{team.name}</span>
            {role === 'LEADER' && (
              <Badge variant="secondary" className="gap-1 text-[10px] uppercase">
                <Crown className="size-3 text-chart-2" /> Leader
              </Badge>
            )}
          </div>
          <div className="mt-3 flex -space-x-2">
            {team.members.slice(0, 6).map((m) => (
              <Avatar key={m.id} className="size-7 border-2 border-card" title={m.user.name || m.user.email}>
                <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">{initials(m.user.name, m.user.email)}</AvatarFallback>
              </Avatar>
            ))}
            {team.members.length > 6 && (
              <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-semibold text-muted-foreground">
                +{team.members.length - 6}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold tracking-wide text-muted-foreground uppercase">Tasks</span>
              <span className="tabular-nums text-muted-foreground">
                {tasksDone}/{tasksTotal}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-linear-to-r from-primary to-chart-2" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="text-sm">
            {submission ? (
              <a
                href={submission.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-chart-3 hover:underline"
              >
                <CheckCircle2 className="size-4" />
                Submitted
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Rocket className="size-4" />
                No submission yet
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const entries = useProfileActivity(user?.id);

  useEffect(() => {
    // Wait for the auth context to resolve; re-run on user change so navigating back
    // here after signing in actually retries the fetch.
    if (authLoading) return;
    if (!user) {
      setError('Not signed in.');
      return;
    }
    setError(null);
    api
      .me()
      .then((u) => {
        setProfile(u);
        setName(u.name ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'));
  }, [user, authLoading]);

  const stats = useMemo(() => (entries && user ? statsOf(entries, user.id) : emptyStats), [entries, user]);
  const points = stats.events * 50 + stats.submissions * 100 + stats.led * 25 + stats.tasksDone * 10 + stats.described * 10;
  const levelIdx = Math.max(0, LEVELS.filter((l) => points >= l.min).length - 1);
  const level = LEVELS[levelIdx];
  const nextLevel = LEVELS[levelIdx + 1];
  const progress = nextLevel ? ((points - level.min) / (nextLevel.min - level.min)) * 100 : 100;

  const badges: { icon: LucideIcon; name: string; hint: string; tier: string; earned: boolean }[] = [
    { icon: Rocket, name: 'First Steps', hint: 'Join a hackathon', tier: 'Bronze', earned: stats.events >= 1 },
    { icon: Users, name: 'Team Player', hint: 'Be on a team of 2+', tier: 'Bronze', earned: stats.bestTeamSize >= 2 },
    { icon: Handshake, name: 'Collaborator', hint: 'Work with 3 people', tier: 'Silver', earned: stats.collaborators >= 3 },
    { icon: Crown, name: 'Team Leader', hint: 'Lead a team', tier: 'Silver', earned: stats.led >= 1 },
    { icon: ListChecks, name: 'Task Master', hint: 'Complete 5 tasks', tier: 'Silver', earned: stats.tasksDone >= 5 },
    { icon: Medal, name: 'Shipped It', hint: 'Submit a project', tier: 'Silver', earned: stats.submissions >= 1 },
    { icon: Flame, name: '5x Hacker', hint: 'Join 5 hackathons', tier: 'Gold', earned: stats.events >= 5 },
    { icon: Trophy, name: 'Hackathon Legend', hint: 'Join 10 hackathons', tier: 'Gold', earned: stats.events >= 10 },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;

  const timeline = useMemo(() => {
    const items: { at: string; icon: LucideIcon; text: string; tone: string }[] = [];
    for (const e of entries ?? []) {
      items.push({ at: e.joinedAt, icon: Users, text: `Joined ${e.team.name} for ${e.hackathon.title}`, tone: 'bg-primary/10 text-primary' });
      if (e.submission) {
        items.push({ at: e.submission.submittedAt, icon: Rocket, text: `Submitted a project to ${e.hackathon.title}`, tone: 'bg-chart-3/15 text-chart-3' });
      }
    }
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 6);
  }, [entries]);

  const radar = {
    technical: Math.min(stats.submissions / 3, 1),
    business: Math.min(stats.events / 3, 1),
    creativity: Math.min(stats.described / 3, 1),
    leadership: Math.min(stats.led / 2, 1),
  };

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name });
      setProfile(updated);
      toast.success('Profile updated', { description: 'Your changes have been saved.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setError(message);
      toast.error('Could not save profile', { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function onSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('Signed out', { description: 'See you next time.' });
    } catch {
      // The session is cleared on this device even if the server could not be reached.
      toast.warning('Signed out on this device', {
        description: 'We could not reach the server to end your session there.',
      });
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
    router.push('/');
    router.refresh();
  }

  async function onResend() {
    if (!profile) return;
    setResending(true);
    try {
      await api.resendVerificationEmail(profile.email);
      toast.success('Verification email sent', { description: 'Check your inbox.' });
    } catch (err) {
      toast.error('Could not send email', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setResending(false);
    }
  }

  if (authLoading || (!profile && !error)) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-14">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      </div>
    );
  }
  if (!profile) return null;

  const isAdmin = profile.role === 'ADMIN';
  const handle = profile.email.split('@')[0];

  return (
    <div className="pb-20">
      {/* Cover + identity */}
      <div className="dark relative overflow-hidden bg-background text-foreground">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_45%,transparent),transparent)]" />
        <div className="relative mx-auto h-40 max-w-6xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="relative -mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="size-32 ring-8 ring-background sm:size-36">
              <AvatarFallback className="bg-linear-to-br from-primary via-chart-4 to-chart-2 text-5xl font-extrabold text-white">
                {initials(profile.name, profile.email)}
              </AvatarFallback>
            </Avatar>
            <div className="sm:pt-[5.25rem]">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">{profile.name || handle}</h1>
                {isAdmin && <Badge className="bg-primary/15 text-primary">Organizer</Badge>}
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                  <Sparkles className="size-3" /> {level.name}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">@{handle}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {profile.email}
                </span>
                {profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-chart-3">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                ) : (
                  <button onClick={onResend} disabled={resending} className="inline-flex items-center gap-1.5 font-medium text-amber-600 hover:underline dark:text-amber-400">
                    {resending ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldAlert className="size-3.5" />}
                    Not verified. Resend email
                  </button>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/#hackathons">
                <Rocket />
                Find a hackathon
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#settings">Edit profile</a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile icon={Star} label="Points" value={points} accent="bg-amber-400/15 text-amber-500" />
          <StatTile icon={Trophy} label="Events joined" value={stats.events} accent="bg-primary/10 text-primary" />
          <StatTile icon={Rocket} label="Submissions" value={stats.submissions} accent="bg-chart-3/15 text-chart-3" />
          <StatTile icon={ListChecks} label="Tasks completed" value={stats.tasksDone} accent="bg-chart-2/15 text-chart-2" />
          <StatTile icon={Crown} label="Teams led" value={stats.led} accent="bg-chart-4/15 text-chart-4" />
          <StatTile icon={Users} label="Collaborators" value={stats.collaborators} accent="bg-primary/10 text-primary" />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Left: hackathons + activity */}
          <div className="space-y-10 lg:col-span-2">
            <section>
              <h2 className="mb-4 text-lg font-bold tracking-tight">My hackathons</h2>
              {!entries ? (
                <div className="space-y-4">
                  <Skeleton className="h-44 rounded-xl" />
                  <Skeleton className="h-44 rounded-xl" />
                </div>
              ) : entries.length === 0 ? (
                <Card className="rounded-xl border-dashed">
                  <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                    <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Rocket className="size-6" />
                    </span>
                    <p className="font-semibold">You have not joined a hackathon yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">Join or create a team in an upcoming event and it will show up here with your progress.</p>
                    <Button asChild className="mt-1">
                      <Link href="/#hackathons">
                        Browse hackathons <ArrowRight />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {entries.map((e) => (
                    <EntryCard key={e.hackathon.id} entry={e} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold tracking-tight">Recent activity</h2>
              <Card className="rounded-xl shadow-sm">
                <CardContent>
                  {timeline.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">Your activity will appear here.</p>
                  ) : (
                    <ol className="relative space-y-5 border-l pl-6">
                      {timeline.map((t, i) => (
                        <li key={i} className="relative">
                          <span className={`absolute -left-[2.15rem] grid size-7 place-items-center rounded-full ring-4 ring-card ${t.tone}`}>
                            <t.icon className="size-3.5" />
                          </span>
                          <p className="text-sm font-medium">{t.text}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(t.at)}</p>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Right: level + radar */}
          <div className="space-y-6">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Level</CardTitle>
                <CardDescription>
                  {nextLevel ? `${nextLevel.min - points} pts to ${nextLevel.name}` : 'Top level reached'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{level.name}</span>
                  <span className="font-semibold tabular-nums">{points} pts</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-linear-to-r from-primary to-chart-2 transition-all duration-700" style={{ width: `${Math.max(progress, 3)}%` }} />
                </div>
                <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                  <li className="flex justify-between"><span>Event joined</span><span>+50</span></li>
                  <li className="flex justify-between"><span>Project submitted</span><span>+100</span></li>
                  <li className="flex justify-between"><span>Team led</span><span>+25</span></li>
                  <li className="flex justify-between"><span>Task completed</span><span>+10</span></li>
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Skills</CardTitle>
                <CardDescription>Based on your events, teams and submissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <Radar values={radar} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Badges */}
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Award className="size-5 text-primary" />
              Badges
            </h2>
            <span className="text-sm text-muted-foreground">
              {earnedCount} of {badges.length} earned
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {badges.map(({ icon: Icon, name: label, hint, tier, earned }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center" title={hint}>
                <div
                  className={`grid size-20 place-items-center rounded-2xl border transition ${
                    earned ? 'border-primary/30 bg-linear-to-br from-primary/20 to-chart-2/20 text-primary shadow-md shadow-primary/10' : 'bg-muted text-muted-foreground/50 grayscale'
                  }`}
                >
                  <Icon className="size-9" />
                </div>
                <p className={`text-sm font-semibold ${earned ? '' : 'text-muted-foreground'}`}>{label}</p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${earned ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                  {earned ? tier : hint}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Settings */}
        <section id="settings" className="mt-12 scroll-mt-24">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Profile settings</CardTitle>
              <CardDescription>This name is shown to teammates and on your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled className="h-10" />
                </div>
                {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
                <div className="sm:col-span-2">
                  <Button type="submit" size="lg" disabled={saving}>
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Session */}
        <section className="mt-8">
          <Card className="rounded-xl border-destructive/20 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Sign out</h2>
                <p className="text-sm text-muted-foreground">End your session on this device. You can sign back in at any time.</p>
              </div>
              <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="lg">
                    <LogOut />
                    Sign out
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign out of Hackathon?</DialogTitle>
                    <DialogDescription>You will need to sign in again to join teams and submit projects.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSignOutOpen(false)} disabled={signingOut}>
                      Stay signed in
                    </Button>
                    <Button variant="destructive" onClick={onSignOut} disabled={signingOut}>
                      {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                      {signingOut ? 'Signing out…' : 'Sign out'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
