'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function NavBar() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-4" />
          </span>
          <span className="text-base">Hackathon</span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? (
            <Skeleton className="h-9 w-24 rounded-full" />
          ) : user ? (
            <>
              <Link href="/profile" className="hidden items-center gap-2 rounded-full py-1 pr-1 transition hover:opacity-80 sm:flex">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary text-xs font-medium">
                    {initials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.name || user.email}</span>
                {user.role === 'ADMIN' && (
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                    Admin
                  </Badge>
                )}
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
