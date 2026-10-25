'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/AuthShell';
import { PasswordInput } from '@/components/PasswordInput';

export default function AdminSignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.adminSignUp({ name: name || undefined, email, password, inviteCode });
      toast.success('Organizer account created', { description: 'Check your email to verify your address, then sign in.' });
      router.push(`/admin/sign-in?registered=1&email=${encodeURIComponent(email)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      toast.error('Could not create the account', { description: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell variant="admin">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <ShieldCheck className="size-6" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight">Create an organizer account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Organizer accounts need an invite code from the site owner.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" autoComplete="name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="organizer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite">Invite code</Label>
          <div className="relative">
            <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="invite" required minLength={8} autoComplete="off" placeholder="Paste your invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="h-10 pl-9 font-mono" />
          </div>
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
            {/already exists/i.test(error) && (
              <p className="mt-2 text-xs font-semibold">
                <Link href={`/admin/sign-in?email=${encodeURIComponent(email)}`} className="underline">
                  Organizer sign in
                </Link>
              </p>
            )}
          </div>
        )}
        <Button type="submit" disabled={submitting} className="h-10 w-full shadow-lg shadow-primary/25">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? 'Creating account…' : 'Create organizer account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already an organizer?{' '}
        <Link href="/admin/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Taking part in a hackathon?{' '}
        <Link href="/sign-up" className="font-medium text-foreground hover:underline">
          Participant sign up
        </Link>
      </p>
    </AuthShell>
  );
}
