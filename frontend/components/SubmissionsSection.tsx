'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Loader2, Rocket } from 'lucide-react';
import { api } from '@/lib/api';
import type { TeamSubmission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function load() {
    api.listSubmissions(hackathonId).then((items) => {
      setSubmissions(items);
      if (myTeamId) {
        const mine = items.find((i) => i.teamId === myTeamId)?.submission;
        if (mine) {
          setLink(mine.link);
          setDescription(mine.description ?? '');
        }
      }
    });
  }

  useEffect(load, [hackathonId, myTeamId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!myTeamId) return;
    setError(null);
    setSaving(true);
    try {
      await api.upsertSubmission(myTeamId, { link, description: description || undefined });
      setSaved(true);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save submission');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Rocket className="size-4 text-muted-foreground" />
          Submissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {myTeamId && (
          <>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sub-link">Your team&apos;s project link</Label>
                <Input
                  id="sub-link"
                  type="url"
                  required
                  disabled={deadlinePassed}
                  placeholder="https://github.com/your-team/project"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sub-desc">Description (optional)</Label>
                <Textarea
                  id="sub-desc"
                  disabled={deadlinePassed}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {deadlinePassed ? (
                <p className="text-xs text-muted-foreground">Submissions are closed.</p>
              ) : (
                <Button type="submit" size="sm" disabled={saving}>
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  {saved ? 'Update submission' : 'Submit project'}
                </Button>
              )}
            </form>
            <Separator />
          </>
        )}

        {submissions === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {submissions?.filter((s) => s.submission).length === 0 && (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        )}
        <ul className="space-y-3">
          {submissions
            ?.filter((s) => s.submission)
            .map((s) => (
              <li key={s.teamId} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{s.teamName}</p>
                  <a
                    href={s.submission!.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View project <ExternalLink className="size-3" />
                  </a>
                </div>
                {s.submission!.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{s.submission!.description}</p>
                )}
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
