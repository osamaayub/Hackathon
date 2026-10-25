import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Activate your Hackathon account.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
