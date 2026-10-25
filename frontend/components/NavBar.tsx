'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const links = [
  { href: '/hackathons', label: 'Hackathons' },
  { href: '/projects', label: 'Projects' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/resources', label: 'Resources' },
  { href: '/about', label: 'About' },
];

export function NavBar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu after navigating.
  useEffect(() => setMobileOpen(false), [pathname]);

  const onProfile = pathname === '/profile';

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
      <nav
        aria-label="Main"
        className={`mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border bg-background/75 pr-2 pl-5 backdrop-blur-xl transition-shadow supports-backdrop-filter:bg-background/60 ${
          scrolled ? 'shadow-lg shadow-black/10' : 'shadow-sm'
        }`}
      >
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Hackathon home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition hover:bg-muted hover:text-foreground ${
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {loading ? (
            <Skeleton className="h-9 w-28 rounded-full" />
          ) : user ? (
            <Link
              href="/profile"
              aria-label="Open your profile"
              aria-current={onProfile ? 'page' : undefined}
              className={`flex items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 transition hover:bg-muted ${
                onProfile ? 'border-primary/40 bg-primary/10' : 'bg-card'
              }`}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-linear-to-br from-primary via-chart-4 to-chart-2 text-[0.6875rem] font-bold text-white">
                  {initials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:block">{user.name || 'Profile'}</span>
            </Link>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden rounded-full sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="rounded-full px-4">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-5xl rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted">
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link href="/profile" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted">
              Profile
            </Link>
          ) : (
            <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
