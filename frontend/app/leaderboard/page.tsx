'use client';

import { useState } from 'react';
import { Crown, Medal, RefreshCw, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLeaderboard } from '@/lib/use-community-data';
import { AuthGate } from '@/components/AuthGate';
import { PageHero } from '@/components/PageHero';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const podium = [
  { rank: 2, ring: 'ring-slate-300', badge: 'bg-slate-300 text-slate-900', height: 'sm:pt-10', icon: Medal },
  { rank: 1, ring: 'ring-amber-400', badge: 'bg-amber-400 text-amber-950', height: '', icon: Crown },
  { rank: 3, ring: 'ring-orange-400', badge: 'bg-orange-400 text-orange-950', height: 'sm:pt-14', icon: Medal },
];

function Board() {
  const { user } = useAuth();
  const [retry, setRetry] = useState(0);
  const { data: rows, error } = useLeaderboard(user?.id, retry);

  if (error && !rows) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setRetry((k) => k + 1)}>
            <RefreshCw /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-14">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const top3 = rows.slice(0, 3);
  const me = rows.findIndex((r) => r.id === user?.id);

  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      {top3.length >= 3 && (
        <div className="grid items-end gap-4 sm:grid-cols-3">
          {podium.map(({ rank, ring, badge, height, icon: Icon }) => {
            const r = top3[rank - 1];
            return (
              <div key={rank} className={`flex flex-col items-center rounded-2xl border bg-card p-6 text-center shadow-sm ${height}`}>
                <div className="relative">
                  <Avatar className={`size-20 ring-4 ${ring}`}>
                    <AvatarFallback className="bg-linear-to-br from-primary via-chart-4 to-chart-2 text-xl font-bold text-white">{initials(r.name, r.name)}</AvatarFallback>
                  </Avatar>
                  <span className={`absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full text-sm font-extrabold ${badge}`}>
                    {rank === 1 ? <Icon className="size-4" /> : rank}
                  </span>
                </div>
                <p className="mt-4 font-bold">{r.name}</p>
                <p className="text-2xl font-extrabold tabular-nums">
                  {r.points} <span className="text-sm font-medium text-muted-foreground">pts</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.events} events · {r.submissions} projects
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Trophy className="size-4 text-primary" />
            Full ranking
          </h2>
          {me >= 0 && <span className="text-sm text-muted-foreground">You are ranked #{me + 1}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3 font-semibold">#</th>
                <th className="px-2 py-3 font-semibold">Participant</th>
                <th className="px-2 py-3 text-right font-semibold">Events</th>
                <th className="px-2 py-3 text-right font-semibold">Led</th>
                <th className="px-2 py-3 text-right font-semibold">Projects</th>
                <th className="px-5 py-3 text-right font-semibold">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b last:border-0 ${r.id === user?.id ? 'bg-primary/5' : ''}`}>
                  <td className="px-5 py-3 font-semibold tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-[0.6875rem] font-semibold">{initials(r.name, r.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {r.name}
                        {r.id === user?.id && <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-bold text-primary uppercase">You</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{r.events}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{r.led}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{r.submissions}</td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">Points: 50 per event joined, 25 per team led, 100 per project submitted.</p>
    </section>
  );
}

export default function LeaderboardPage() {
  return (
    <>
      <PageHero eyebrow="Leaderboard" title={<>Top <span className="text-gradient">builders</span></>} description="See who is shipping the most across every hackathon on the platform." />
      <AuthGate what="the leaderboard">
        <Board />
      </AuthGate>
    </>
  );
}
