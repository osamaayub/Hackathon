import Link from 'next/link';
import { Calendar, Globe, MapPin, Users } from 'lucide-react';
import type { Hackathon } from '@/lib/types';
import { dateRange, phaseOf, type Phase } from '@/lib/hackathon';
import { Card, CardContent } from '@/components/ui/card';
import { EventBanner } from '@/components/EventBanner';

export function PhasePill({ phase }: { phase: Phase }) {
  if (phase === 'Live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900 shadow">
        <span className="size-2 rounded-full bg-red-500" />
        LIVE
      </span>
    );
  }
  if (phase === 'Register') {
    return <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">Register</span>;
  }
  return <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow">Finished</span>;
}

/** Event card used on the home page and the hackathons listing. */
export function HackathonCard({ h }: { h: Hackathon }) {
  const phase = phaseOf(h);
  const teams = h._count?.teams ?? 0;
  return (
    <Link href={`/hackathons/${h.id}`} className="group">
      <Card className="h-full gap-0 overflow-hidden rounded-xl py-0 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative">
          <EventBanner title={h.title} />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            <PhasePill phase={phase} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
              <Globe className="size-3.5" />
              {h.location ? 'On-site' : 'Online'}
            </span>
          </div>
        </div>
        <CardContent className="space-y-3 px-5 py-5">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium uppercase">
              <Calendar className="size-3" />
              {dateRange(h.startDate, h.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              {teams}
            </span>
          </div>
          <h3 className="text-xl leading-snug font-bold tracking-tight group-hover:text-primary">{h.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{h.description}</p>
          {h.location && (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {h.location}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
