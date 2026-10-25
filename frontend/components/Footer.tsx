import Link from 'next/link';
import { Logo } from '@/components/Logo';

const columns = [
  {
    title: 'Platform',
    links: [
      { href: '/hackathons', label: 'Hackathons' },
      { href: '/projects', label: 'Projects' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/features', label: 'Features' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/resources', label: 'Guides' },
      { href: '/faq', label: 'FAQ' },
      { href: '/#how-it-works', label: 'How it works' },
      { href: '/about', label: 'About' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { href: '/sponsors', label: 'Sponsors' },
      { href: '/contact', label: 'Contact' },
      { href: '/sign-in', label: 'Sign in' },
      { href: '/admin/sign-in', label: 'Organizer sign in' },
      { href: '/sign-up', label: 'Create account' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            The home for hackathons. Form a team, hit your milestones, and ship something you are proud of.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>&copy; Hackathon. All rights reserved.</span>
          <span>Build together. Ship fast.</span>
        </div>
      </div>
    </footer>
  );
}
