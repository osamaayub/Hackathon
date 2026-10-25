'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/AuthShell';
import { PasswordInput } from '@/components/PasswordInput';

export default function AdminSignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password, 'admin');
      toast.success('Welcome back, organizer', { description: 'You are signed in to the organizer portal.' });
      router.push('/hackathons');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      toast.error('Could not sign in', { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell variant="admin">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <ShieldCheck className="size-6" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">Organizer sign in</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">For people who create and manage hackathons.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Organizer email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="organizer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" required autoComplete="current-password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
            {/participant page/i.test(error) && (
              <p className="mt-2 text-xs font-semibold">
                <Link href="/sign-in" className="underline">
                  Go to participant sign in
                </Link>
              </p>
            )}
          </div>
        )}
        <Button type="submit" disabled={submitting} className="h-10 w-full shadow-lg shadow-primary/25">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? 'Signing in…' : 'Sign in as organizer'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Taking part in a hackathon?{' '}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Participant sign in
        </Link>
      </p>
    </AuthShell>
  );
}
