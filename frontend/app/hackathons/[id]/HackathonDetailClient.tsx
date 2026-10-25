'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Calendar, Crown, Loader2, LogOut, MapPin, Plus, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { HackathonDetail } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Countdown } from '@/components/Countdown';
import dynamic from 'next/dynamic';
import { SectionSkeleton } from '@/components/PageSkeleton';

// Below the fold sections load as separate chunks and stream in behind skeletons,
// which keeps the first paint of the hackathon page small and fast.
const ScheduleSection = dynamic(() => import('@/components/ScheduleSection').then((m) => m.ScheduleSection), {
  loading: () => <SectionSkeleton rows={3} />,
});
const TaskChecklist = dynamic(() => import('@/components/TaskChecklist').then((m) => m.TaskChecklist), {
  loading: () => <SectionSkeleton rows={3} />,
});
const SubmissionsSection = dynamic(() => import('@/components/SubmissionsSection').then((m) => m.SubmissionsSection), {
  loading: () => <SectionSkeleton rows={2} />,
});
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

const teamAccents = [
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

function formatDateRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function HackathonDetailClient({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const [hackathon, setHackathon] = useState<HackathonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .getHackathon(id)
      .then(setHackathon)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load hackathon'));
  }, [id]);

  useEffect(() => {
    // Wait for the auth context to resolve; re-run on user change so navigating back
    // here after signing in actually retries the fetch (see the same fix on the home page).
    if (authLoading) return;
    load();
  }, [load, user, authLoading]);

  async function onCreateTeam(e: FormEvent) {
    e.preventDefault();
    setActionError(null);
    setCreating(true);
    try {
      await api.createTeam({ hackathonId: id, name: teamName, description: teamDescription || undefined });
      setTeamName('');
      setTeamDescription('');
      setDialogOpen(false);
      toast.success('Team created', { description: 'You are the team leader.' });
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create team';
      setActionError(message);
      toast.error('Could not create team', { description: message });
    } finally {
      setCreating(false);
    }
  }

  async function onJoin(teamId: string) {
    setActionError(null);
    setPendingTeamId(teamId);
    try {
      await api.joinTeam(teamId);
      toast.success('Joined team', { description: 'Welcome aboard!' });
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join team';
      setActionError(message);
      toast.error('Could not join team', { description: message });
    } finally {
      setPendingTeamId(null);
    }
  }

  async function onLeave(teamId: string) {
    setActionError(null);
    setPendingTeamId(teamId);
    try {
      await api.leaveTeam(teamId);
      toast.success('Left team');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to leave team';
      setActionError(message);
      toast.error('Could not leave team', { description: message });
    } finally {
      setPendingTeamId(null);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-6 h-20 w-full" />
      </div>
    );
  }

  const alreadyInATeam = hackathon.teams.some((t) => t.members.some((m) => m.userId === user?.id));
  const myTeamId = hackathon.teams.find((t) => t.members.some((m) => m.userId === user?.id))?.id ?? null;
  const isAdmin = user?.role === 'ADMIN';
  const deadlinePassed = new Date(hackathon.endDate).getTime() < Date.now();

  return (
    <div>
      <div className="dark relative overflow-hidden bg-background text-foreground">
        <div className="bg-grid absolute inset-0" />
        <div className="animate-float absolute -top-20 -left-10 size-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="animate-float absolute top-0 right-0 size-64 rounded-full bg-chart-2/20 blur-3xl [animation-delay:-4s]" />
        <div className="relative mx-auto max-w-5xl px-6 py-14">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="animate-rise">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{hackathon.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDateRange(hackathon.startDate, hackathon.endDate)}
                </span>
                {hackathon.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {hackathon.location}
                  </span>
                )}
              </div>
            </div>
            {hackathon.status === 'CLOSED' && <Badge variant="outline">Closed</Badge>}
          </div>
          <p className="animate-rise mt-5 max-w-2xl leading-relaxed text-muted-foreground [animation-delay:100ms]">
            {hackathon.description}
          </p>
          <div className="animate-rise mt-8 [animation-delay:200ms]">
            <Countdown endDate={hackathon.endDate} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12">
        <ScheduleSection hackathonId={id} isAdmin={isAdmin} />
        {user && <TaskChecklist hackathonId={id} isAdmin={isAdmin} inTeam={alreadyInATeam} />}

        <section aria-labelledby="teams-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="teams-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-5" />
                </span>
                Teams
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {hackathon.teams.length}
                {hackathon.maxTeams ? ` of ${hackathon.maxTeams}` : ''} team{hackathon.teams.length === 1 ? '' : 's'}
                {hackathon.maxTeamSize ? ` \u00b7 up to ${hackathon.maxTeamSize} members each` : ''}
              </p>
            </div>
            {user && !alreadyInATeam && hackathon.status === 'PUBLISHED' && (
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setTeamName('');
                    setTeamDescription('');
                    setActionError(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus />
                    Create team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={onCreateTeam}>
                    <DialogHeader>
                      <DialogTitle>Create a team</DialogTitle>
                      <DialogDescription>Give your team a name. You will be its leader.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="team-name">Team name</Label>
                        <Input id="team-name" required minLength={2} value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="team-description">Description (optional)</Label>
                        <Textarea id="team-description" value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} />
                      </div>
                      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={creating}>
                        {creating && <Loader2 className="size-4 animate-spin" />}
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {actionError && !dialogOpen && (
            <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          )}

          {hackathon.teams.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
              <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-6" />
              </span>
              <p className="font-semibold">No teams yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">Be the first to create a team and start building.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {hackathon.teams.map((team, index) => {
                const membership = team.members.find((m) => m.userId === user?.id);
                const isPending = pendingTeamId === team.id;
                const cap = hackathon.maxTeamSize ?? null;
                const full = cap !== null && team.members.length >= cap;
                const accent = teamAccents[index % teamAccents.length];
                const leader = team.members.find((m) => m.role === 'LEADER');
                const ordered = [...team.members].sort((x, y) => Number(y.role === 'LEADER') - Number(x.role === 'LEADER'));
                const shown = ordered.slice(0, 5);

                return (
                  <article
                    key={team.id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                      membership ? 'ring-2 ring-primary/40' : ''
                    }`}
                  >
                    <div className={`h-1.5 bg-linear-to-r ${accent}`} />
                    <div className="flex flex-1 flex-col gap-5 p-5">
                      <div className="flex items-start gap-3">
                        <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-linear-to-br text-base font-extrabold text-white shadow-md ${accent}`}>
                          {team.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-bold tracking-tight">{team.name}</h3>
                            {membership && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.625rem] font-bold text-primary uppercase">Your team</span>
                            )}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                            {team.description || 'No description yet.'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold tracking-wide text-muted-foreground uppercase">Members</span>
                          <span className={`font-medium tabular-nums ${full ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {team.members.length}
                            {cap ? ` / ${cap}` : ''}
                            {full ? ' \u00b7 Full' : ''}
                          </span>
                        </div>
                        {cap && (
                          <div className="mt-2 flex gap-1" aria-hidden>
                            {Array.from({ length: cap }).map((_, i) => (
                              <span
                                key={i}
                                className={`h-1.5 flex-1 rounded-full ${i < team.members.length ? `bg-linear-to-r ${accent}` : 'bg-muted'}`}
                              />
                            ))}
                          </div>
                        )}
                        <ul className="mt-3 space-y-2">
                          {shown.map((m) => (
                            <li key={m.id} className="flex items-center gap-2.5">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-secondary text-[0.6875rem] font-semibold">{initials(m.user.name, m.user.email)}</AvatarFallback>
                              </Avatar>
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {m.user.name || m.user.email}
                                {m.userId === user?.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                              </span>
                              {m.role === 'LEADER' ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[0.625rem] font-bold text-amber-600 uppercase dark:text-amber-400">
                                  <Crown className="size-3" /> Leader
                                </span>
                              ) : (
                                <span className="text-[0.625rem] font-semibold text-muted-foreground uppercase">Member</span>
                              )}
                            </li>
                          ))}
                          {team.members.length > shown.length && (
                            <li className="pl-1 text-xs text-muted-foreground">+{team.members.length - shown.length} more</li>
                          )}
                          {team.members.length === 0 && leader === undefined && (
                            <li className="text-sm text-muted-foreground">No members yet.</li>
                          )}
                        </ul>
                      </div>

                      {user && (
                        <div className="mt-auto">
                          {membership ? (
                            <Button variant="outline" className="w-full" disabled={isPending} onClick={() => onLeave(team.id)}>
                              {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
                              Leave team
                            </Button>
                          ) : hackathon.status !== 'PUBLISHED' ? (
                            <p className="rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">This event is closed to new members.</p>
                          ) : alreadyInATeam ? (
                            <p className="rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">You are already on a team in this event.</p>
                          ) : full ? (
                            <Button variant="outline" className="w-full" disabled>
                              Team is full
                            </Button>
                          ) : (
                            <Button className="w-full" disabled={isPending} onClick={() => onJoin(team.id)}>
                              {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
                              Join team
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {user && <SubmissionsSection hackathonId={id} myTeamId={myTeamId} deadlinePassed={deadlinePassed} />}
      </div>
    </div>
  );
}
