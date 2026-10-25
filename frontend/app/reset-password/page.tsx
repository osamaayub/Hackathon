'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, TriangleAlert } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/AuthShell';
import { PasswordInput } from '@/components/PasswordInput';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null | undefined>(undefined); // undefined = not read yet
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The emailed link looks like /reset-password?token=...
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token'));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (!token) return;
    setSubmitting(true);
    try {
      await api.resetPassword(token, password);
      toast.success('Password updated', { description: 'Sign in with your new password.' });
      router.push('/sign-in?reset=1');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not reset the password';
      setError(message);
      toast.error('Could not reset the password', { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  if (token === null) {
    return (
      <AuthShell>
        <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-6" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">This link is not valid</h1>
        <p className="mt-2 text-sm text-muted-foreground">The reset link is missing its code. Request a new one and use the link from the latest email.</p>
        <Button asChild className="mt-8 h-10 w-full">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-3xl font-semibold tracking-tight">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Use at least 8 characters. You will be signed out on other devices.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <PasswordInput id="confirm" required minLength={8} autoComplete="new-password" placeholder="Type it again" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
            {/invalid|expired/i.test(error) && (
              <p className="mt-1 text-xs">
                <Link href="/forgot-password" className="font-medium underline">
                  Request a new link
                </Link>
              </p>
            )}
          </div>
        )}
        <Button type="submit" disabled={submitting || token === undefined} className="h-10 w-full shadow-lg shadow-primary/25">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
