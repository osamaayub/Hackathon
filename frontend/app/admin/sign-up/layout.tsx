import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Organizer sign up',
  description: 'Create an organizer account to manage hackathons.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
