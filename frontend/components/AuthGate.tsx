'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Shows its children to signed in users and a friendly sign in prompt to everyone else. */
export function AuthGate({ children, what }: { children: ReactNode; what: string }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-card px-8 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-6" />
          </span>
          <h2 className="text-xl font-bold">Sign in to see {what}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">It is free and takes a minute. Your account unlocks events, teams and projects.</p>
          <div className="mt-2 flex gap-2">
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
