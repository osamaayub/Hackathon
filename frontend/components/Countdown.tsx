'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function timeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-semibold tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export function Countdown({ endDate }: { endDate: string }) {
  const target = new Date(endDate);
  const [remaining, setRemaining] = useState(() => timeLeft(target));

  useEffect(() => {
    const id = setInterval(() => setRemaining(timeLeft(target)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate]);

  if (!remaining) {
    return (
      <Card className="border-muted-foreground/20 bg-muted/40">
        <CardContent className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Timer className="size-4" />
          Submissions are closed.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-5 py-4">
        <Timer className="size-5 shrink-0 text-primary" />
        <div className="flex flex-1 items-center justify-around gap-3">
          <Unit value={remaining.days} label="Days" />
          <Unit value={remaining.hours} label="Hrs" />
          <Unit value={remaining.minutes} label="Min" />
          <Unit value={remaining.seconds} label="Sec" />
        </div>
        <span className="hidden text-xs text-muted-foreground sm:block">until submissions close</span>
      </CardContent>
    </Card>
  );
}
