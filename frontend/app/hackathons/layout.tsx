import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Hackathons',
  description: 'Browse live, upcoming and past hackathons, then join a team and start building.',
  alternates: { canonical: '/hackathons' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
