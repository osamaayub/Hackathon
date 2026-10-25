'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Catches unexpected errors in any page below the root layout, so the navbar and footer stay usable.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="text-3xl font-extrabold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground">
        We hit an unexpected problem loading this page. Your data is safe. Try again, or head back home.
      </p>
      {error.digest && <p className="font-mono text-xs text-muted-foreground">Reference: {error.digest}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={() => retry()}>
          <RefreshCw />
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">
            <Home />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
