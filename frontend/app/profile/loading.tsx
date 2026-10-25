import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading profile">
      <div className="dark bg-background" aria-hidden>
        <div className="mx-auto h-40 max-w-6xl" />
      </div>
      <div className="mx-auto max-w-6xl px-6" aria-hidden>
        <div className="relative -mt-16 flex items-end gap-4 sm:-mt-20">
          <Skeleton className="size-32 rounded-full ring-8 ring-background sm:size-36" />
          <div className="space-y-2 pb-1 sm:pt-20">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
