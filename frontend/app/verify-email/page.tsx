'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { BadgeCheck, Loader2, MailWarning, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/AuthShell';

type State = 'checking' | 'verified' | 'failed' | 'missing';

export default function VerifyEmailPage() {
  const [state, setState] = useState<State>('checking');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  // The token can only be used once, and React runs effects twice in development.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState('missing');
      return;
    }

    api
      .verifyEmail(token)
      .then(() => {
        setState('verified');
        toast.success('Email verified', { description: 'Your account is active.' });
        // A full load lets the site pick up the session the verification just created.
        setTimeout(() => window.location.assign('/'), 1800);
      })
      .catch((err) => {
        setMessage(err instanceof Error ? err.message : 'This link could not be verified.');
        setState('failed');
      });
  }, []);

  async function onResend(e: FormEvent) {
    e.preventDefault();
    setResending(true);
    try {
      await api.resendVerificationEmail(email);
      setResent(true);
      toast.success('Verification email sent', { description: 'Check your inbox for the new link.' });
    } catch (err) {
      toast.error('Could not send the email', { description: err instanceof Error ? err.message : undefined });
    } finally {
      setResending(false);
    }
  }

  if (state === 'checking') {
    return (
      <AuthShell>
        <div role="status" className="flex flex-col items-start gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">Verifying your email…</h1>
          <p className="text-sm text-muted-foreground">One moment while we activate your account.</p>
        </div>
      </AuthShell>
    );
  }

  if (state === 'verified') {
    return (
      <AuthShell>
        <span className="flex size-12 items-center justify-center rounded-xl bg-chart-3/15 text-chart-3">
          <BadgeCheck className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">You are all set</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your email is verified and your account is active. Taking you to the site…</p>
        <Button asChild className="mt-8 h-10 w-full">
          <a href="/">Continue</a>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        {state === 'missing' ? <MailWarning className="size-6" /> : <TriangleAlert className="size-6" />}
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">{state === 'missing' ? 'This link is incomplete' : 'We could not verify this link'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {state === 'missing'
          ? 'The link is missing its code. Open the latest verification email and use the button or link in it.'
          : `${message} It may have expired or already been used. If you have already verified, you can just sign in.`}
      </p>

      {resent ? (
        <p role="status" className="mt-6 rounded-lg border border-chart-3/30 bg-chart-3/10 px-3 py-2 text-sm">
          A new link is on its way to {email}.
        </p>
      ) : (
        <form onSubmit={onResend} className="mt-6 space-y-3">
          <Label htmlFor="email">Send me a new verification email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
          <Button type="submit" disabled={resending} className="h-10 w-full">
            {resending && <Loader2 className="size-4 animate-spin" />}
            {resending ? 'Sending…' : 'Resend verification email'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Go to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
