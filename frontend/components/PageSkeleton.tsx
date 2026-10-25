import { Skeleton } from '@/components/ui/skeleton';

/** Dark hero placeholder that matches the real page heroes, so nothing jumps when content arrives. */
export function HeroSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="dark bg-background text-foreground" aria-hidden>
      <div className={`mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 text-center ${tall ? 'py-24' : 'py-20'}`}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4 max-w-xl" />
        <Skeleton className="h-5 w-2/3 max-w-lg" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, className = 'h-72' }: { count?: number; className?: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${className} rounded-2xl`} />
      ))}
    </div>
  );
}

/** Generic page placeholder used by loading.tsx files. */
export function PageSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading page">
      <HeroSkeleton />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <CardGridSkeleton />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/** Placeholder for a titled section card (schedule, tasks, submissions). */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
