import { PageSkeleton } from '@/components/PageSkeleton';

// Shown instantly while a route segment streams in (React Suspense under the hood).
export default function Loading() {
  return <PageSkeleton />;
}
