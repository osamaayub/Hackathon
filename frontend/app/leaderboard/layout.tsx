import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'See the top builders across all hackathons on the platform.',
  alternates: { canonical: '/leaderboard' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
