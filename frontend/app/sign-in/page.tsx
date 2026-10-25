'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/AuthShell';
import { PasswordInput } from '@/components/PasswordInput';

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<'registered' | 'reset' | null>(null);
  const [resending, setResending] = useState(false);

  // Arriving from sign up or from a finished password reset: show a message and prefill the email.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered')) setNotice('registered');
    else if (params.get('reset')) setNotice('reset');
    const prefill = params.get('email');
    if (prefill) setEmail(prefill);
  }, []);

  async function resendVerification() {
    setResending(true);
    try {
      await api.resendVerificationEmail(email);
      toast.success('Verification email sent', { description: 'Check your inbox for the new link.' });
    } catch (err) {
      toast.error('Could not send the email', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!', { description: 'You are signed in.' });
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      toast.error('Could not sign in', { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue to your hackathons.</p>

      {notice === 'registered' && (
        <div role="status" className="mt-6 flex gap-3 rounded-xl border border-chart-3/30 bg-chart-3/10 p-4 text-sm">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-chart-3" />
          <p>
            <span className="font-semibold">Account created.</span> We sent a verification link to your email. Open it, then sign in below.
          </p>
        </div>
      )}
      {notice === 'reset' && (
        <div role="status" className="mt-6 flex gap-3 rounded-xl border border-chart-3/30 bg-chart-3/10 p-4 text-sm">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-chart-3" />
          <p>
            <span className="font-semibold">Password updated.</span> Sign in with your new password.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10"
          />
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
            {/verif/i.test(error) && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="opacity-80">Check your inbox for the verification link.</span>
                <button
                  type="button"
                  disabled={resending || !email}
                  onClick={resendVerification}
                  className="font-semibold underline disabled:opacity-50"
                >
                  {resending ? 'Sending…' : 'Resend it'}
                </button>
              </div>
            )}
          </div>
        )}
        <Button type="submit" disabled={submitting} className="h-10 w-full shadow-lg shadow-primary/25">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
