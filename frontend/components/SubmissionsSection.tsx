'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, ExternalLink, Link2, Loader2, Lock, Pencil, RefreshCw, Rocket, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/hackathon';
import type { TeamSubmission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_DESCRIPTION = 500;

function hostOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return link;
  }
}

const accents = [
  'from-indigo-500 to-violet-600',
  'from-rose-500 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-sky-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

export function SubmissionsSection({
  hackathonId,
  myTeamId,
  deadlinePassed,
}: {
  hackathonId: string;
  myTeamId: string | null;
  deadlinePassed: boolean;
}) {
  const [submissions, setSubmissions] = useState<TeamSubmission[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    api
      .listSubmissions(hackathonId)
      .then(setSubmissions)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load submissions'));
  }, [hackathonId]);

  useEffect(load, [load]);

  const mine = useMemo(
    () => submissions?.find((s) => s.teamId === myTeamId)?.submission ?? null,
    [submissions, myTeamId],
  );
  const submitted = useMemo(() => submissions?.filter((s) => s.submission) ?? [], [submissions]);
  const waiting = useMemo(() => submissions?.filter((s) => !s.submission) ?? [], [submissions]);

  function startEditing() {
    if (!mine) return;
    setLink(mine.link);
    setDescription(mine.description ?? '');
    document.getElementById('sub-link')?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!myTeamId) return;
    setError(null);
    setSaving(true);
    try {
      await api.upsertSubmission(myTeamId, { link, description: description.trim() || undefined });
      toast.success(mine ? 'Submission updated' : 'Project submitted', {
        description: 'Your project link is saved for judges.',
      });
      setLink('');
      setDescription('');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save submission';
      setError(message);
      toast.error('Could not save submission', { description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="submissions-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="submissions-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="size-5" />
            </span>
            Project submissions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {submissions
              ? `${submitted.length} of ${submissions.length} team${submissions.length === 1 ? '' : 's'} have submitted`
              : 'See what teams are building.'}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            deadlinePassed ? 'bg-muted text-muted-foreground' : 'bg-chart-3/15 text-chart-3'
          }`}
        >
          {deadlinePassed ? <Lock className="size-3.5" /> : <Clock className="size-3.5" />}
          {deadlinePassed ? 'Submissions closed' : 'Submissions open'}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Your submission */}
        {myTeamId ? (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2 lg:self-start">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold">Your team&apos;s submission</h3>
              {mine ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-chart-3/15 px-2.5 py-0.5 text-[0.6875rem] font-bold text-chart-3 uppercase">
                  <CheckCircle2 className="size-3" /> Submitted
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.6875rem] font-bold text-muted-foreground uppercase">
                  Not submitted
                </span>
              )}
            </div>

            {mine && (
              <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Currently submitted</p>
                  <a href={mine.link} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium hover:text-primary">
                    {hostOf(mine.link)}
                  </a>
                </div>
                {!deadlinePassed && (
                  <Button type="button" variant="outline" size="sm" onClick={startEditing}>
                    <Pencil />
                    Edit
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="sub-link">{mine ? 'New project link' : 'Project link'}</Label>
              <div className="relative">
                <Link2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="sub-link"
                  type="url"
                  required
                  disabled={deadlinePassed}
                  placeholder="https://github.com/your-team/project"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sub-desc">Description</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {description.length}/{MAX_DESCRIPTION}
                </span>
              </div>
              <Textarea
                id="sub-desc"
                rows={4}
                maxLength={MAX_DESCRIPTION}
                disabled={deadlinePassed}
                placeholder="What did you build and what makes it special?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {deadlinePassed ? (
              <p className="text-sm text-muted-foreground">The deadline has passed, so your submission can no longer be changed.</p>
            ) : (
              <Button type="submit" size="lg" disabled={saving} className="w-full">
                {saving ? <Loader2 className="animate-spin" /> : <Send />}
                {mine ? 'Update submission' : 'Submit project'}
              </Button>
            )}
            {mine && <p className="text-center text-xs text-muted-foreground">Last updated {formatDate(mine.updatedAt)}</p>}
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card p-8 text-center lg:col-span-2 lg:self-start">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Send className="size-5" />
            </span>
            <p className="font-semibold">Join a team to submit</p>
            <p className="text-sm text-muted-foreground">Only team members can submit a project. Create or join a team above to get started.</p>
          </div>
        )}

        {/* Gallery */}
        <div className="lg:col-span-3">
          {loadError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" size="sm" onClick={load}>
                <RefreshCw />
                Try again
              </Button>
            </div>
          ) : submissions === null ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </div>
          ) : submitted.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card p-8 text-center">
              <span className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Rocket className="size-5" />
              </span>
              <p className="font-semibold">No submissions yet</p>
              <p className="text-sm text-muted-foreground">Be the first team to ship. Projects appear here as soon as they are submitted.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {submitted.map((s, i) => {
                const sub = s.submission!;
                const isMine = s.teamId === myTeamId;
                return (
                  <article
                    key={s.teamId}
                    className={`group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                      isMine ? 'ring-2 ring-primary/40' : ''
                    }`}
                  >
                    <div className={`h-1.5 bg-linear-to-r ${accents[i % accents.length]}`} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-3">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br text-sm font-bold text-white ${accents[i % accents.length]}`}>
                          {s.teamName.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <h3 className="flex items-center gap-2 truncate font-bold">
                            {s.teamName}
                            {isMine && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-bold text-primary uppercase">You</span>}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">{hostOf(sub.link)}</p>
                        </div>
                      </div>
                      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {sub.description || 'No description provided.'}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{formatDate(sub.submittedAt)}</span>
                        <Button asChild variant="outline" size="sm">
                          <a href={sub.link} target="_blank" rel="noopener noreferrer">
                            View project <ExternalLink />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {waiting.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Still working: {waiting.map((w) => w.teamName).join(', ')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
