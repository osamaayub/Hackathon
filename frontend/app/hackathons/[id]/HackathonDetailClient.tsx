'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Calendar, Crown, Loader2, MapPin, Plus, Users } from 'lucide-react';
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
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setCreating(false);
    }
  }

  async function onJoin(teamId: string) {
    setActionError(null);
    setPendingTeamId(teamId);
    try {
      await api.joinTeam(teamId);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setPendingTeamId(null);
    }
  }

  async function onLeave(teamId: string) {
    setActionError(null);
    setPendingTeamId(teamId);
    try {
      await api.leaveTeam(teamId);
      load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to leave team');
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{hackathon.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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

      <p className="mt-5 leading-relaxed text-muted-foreground">{hackathon.description}</p>

      <Separator className="my-8" />

      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-medium">
          <Users className="size-5 text-muted-foreground" />
          Teams
          <Badge variant="secondary">{hackathon.teams.length}</Badge>
        </h2>
        {user && !alreadyInATeam && hackathon.status === 'PUBLISHED' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="size-4" />
                Create team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={onCreateTeam}>
                <DialogHeader>
                  <DialogTitle>Create a team</DialogTitle>
                  <DialogDescription>Give your team a name — you&apos;ll be its leader.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="team-name">Team name</Label>
                    <Input
                      id="team-name"
                      required
                      minLength={2}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="team-description">Description (optional)</Label>
                    <Textarea
                      id="team-description"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                    />
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
        <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>
      )}

      <div className="mt-5 space-y-4">
        {hackathon.teams.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No teams yet. Be the first to create one.
            </CardContent>
          </Card>
        )}

        {hackathon.teams.map((team) => {
          const membership = team.members.find((m) => m.userId === user?.id);
          const isPending = pendingTeamId === team.id;
          return (
            <Card key={team.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  {team.description && <p className="mt-1 text-sm text-muted-foreground">{team.description}</p>}
                </div>
                {user &&
                  (membership ? (
                    <Button variant="outline" size="sm" disabled={isPending} onClick={() => onLeave(team.id)}>
                      {isPending && <Loader2 className="size-3.5 animate-spin" />}
                      Leave
                    </Button>
                  ) : (
                    !alreadyInATeam &&
                    hackathon.status === 'PUBLISHED' && (
                      <Button size="sm" disabled={isPending} onClick={() => onJoin(team.id)}>
                        {isPending && <Loader2 className="size-3.5 animate-spin" />}
                        Join
                      </Button>
                    )
                  ))}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {team.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 rounded-full border bg-secondary/40 px-2.5 py-1">
                      <Avatar className="size-5">
                        <AvatarFallback className="text-[10px]">{initials(m.user.name, m.user.email)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{m.user.name || m.user.email}</span>
                      {m.role === 'LEADER' && <Crown className="size-3 text-chart-2" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
