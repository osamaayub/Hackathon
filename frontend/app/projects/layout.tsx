import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Every project submitted to every hackathon, in one gallery.',
  alternates: { canonical: '/projects' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
