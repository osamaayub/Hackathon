import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

const suggestions = [
  { href: '/hackathons', label: 'Browse hackathons' },
  { href: '/projects', label: 'See projects' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/faq', label: 'Read the FAQ' },
];

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="bg-linear-to-r from-primary via-chart-4 to-chart-2 bg-clip-text text-8xl font-extrabold tracking-tight text-transparent">404</p>
      <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Compass className="size-6" />
      </span>
      <h1 className="text-3xl font-extrabold tracking-tight">We could not find that page</h1>
      <p className="text-muted-foreground">The link may be broken, or the page may have moved. Here are some places to go instead.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <Link key={s.href} href={s.href} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium transition hover:bg-muted">
            {s.label}
          </Link>
        ))}
      </div>
      <Button asChild size="lg" className="mt-4">
        <Link href="/">
          Back to home <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
