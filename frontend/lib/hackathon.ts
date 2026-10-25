import type { Hackathon } from './types';

export type Phase = 'Live' | 'Register' | 'Finished';

/** Where a hackathon is in its lifecycle. Call from client code only (reads the current time). */
export function phaseOf(h: Pick<Hackathon, 'status' | 'startDate' | 'endDate'>): Phase {
  const now = Date.now();
  if (h.status === 'CLOSED' || new Date(h.endDate).getTime() < now) return 'Finished';
  if (new Date(h.startDate).getTime() <= now) return 'Live';
  return 'Register';
}

/** "Nov 14 - 16" or "Nov 30 - Dec 2". */
export function dateRange(start: string, end: string) {
  const m = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  return sameMonth
    ? `${m.format(s)} ${s.getDate()} - ${e.getDate()}`
    : `${m.format(s)} ${s.getDate()} - ${m.format(e)} ${e.getDate()}`;
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}
