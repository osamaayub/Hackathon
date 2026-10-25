import { HeroSkeleton, SectionSkeleton } from '@/components/PageSkeleton';

export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading hackathon">
      <HeroSkeleton tall />
      <div className="mx-auto max-w-5xl space-y-14 px-6 py-12">
        <SectionSkeleton rows={4} />
        <SectionSkeleton rows={3} />
        <SectionSkeleton rows={2} />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
