'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, LogIn, MapPin, Sparkles, Users } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { Hackathon } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function formatDateRange(start: string, end: string) {
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    // Wait for the auth context to resolve first; re-run whenever sign in/out changes
    // `user`, so navigating back to "/" after signing in actually retries the fetch
    // instead of being stuck on whatever this page saw the first time it mounted.
    if (authLoading) return;
    if (!user) {
      setNeedsAuth(true);
      return;
    }

    setNeedsAuth(false);
    api
      .listHackathons()
      .then(setHackathons)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setNeedsAuth(true);
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load hackathons');
      });
  }, [user, authLoading]);

  if (needsAuth) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-14">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <LogIn className="size-8 text-muted-foreground" />
            <p className="font-medium">Sign in to see what&apos;s happening</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Hackathons, teams, and everything else live behind your account.
            </p>
            <Button asChild className="mt-2">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden border-b bg-grid">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Badge variant="secondary" className="mb-4 gap-1.5 py-1">
            <Sparkles className="size-3.5 text-primary" />
            Live and upcoming
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Build something <span className="text-primary">great</span> this weekend.
          </h1>
          <p className="mt-3 max-w-xl text-lg text-muted-foreground">
            Browse hackathons, form a team, and start shipping. Everything you need, one place.
          </p>
          {hackathons && hackathons.length > 0 && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{hackathons.length}</span>
              hackathon{hackathons.length === 1 ? '' : 's'} open right now
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {!hackathons && !error && (
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hackathons?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="font-medium">No hackathons yet</p>
            <p className="text-sm text-muted-foreground">Check back soon — new events appear here once published.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {hackathons?.map((h) => (
          <Link key={h.id} href={`/hackathons/${h.id}`} className="group">
            <Card className="h-full overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg group-hover:text-primary">{h.title}</CardTitle>
                  {h.status === 'CLOSED' && (
                    <Badge variant="outline" className="shrink-0 text-muted-foreground">
                      Closed
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {formatDateRange(h.startDate, h.endDate)}
                  </span>
                  {h.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {h.location}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{h.description}</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Users className="size-3.5" />
                  {h._count?.teams ?? 0} team{h._count?.teams === 1 ? '' : 's'}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      </div>
    </div>
  );
}
