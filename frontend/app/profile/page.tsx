'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { BadgeCheck, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    // Wait for the auth context to resolve; re-run on user change so navigating back
    // here after signing in actually retries the fetch (see the same fix on the home page).
    if (authLoading) return;
    if (!user) {
      setError('Not signed in.');
      return;
    }

    setError(null);
    api
      .me()
      .then((u) => {
        setProfile(u);
        setName(u.name ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load profile'));
  }, [user, authLoading]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name });
      setProfile(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function onResend() {
    if (!profile) return;
    setResendMessage(null);
    setResending(true);
    try {
      await api.resendVerificationEmail(profile.email);
      setResendMessage('Verification email sent — check your inbox.');
    } catch (err) {
      setResendMessage(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setResending(false);
    }
  }

  if (authLoading || (!profile && !error)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-14">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-6 h-48 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-14">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">{error ?? 'Not signed in.'}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-2 text-muted-foreground">Manage your account details.</p>

      <Card className="mt-8">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">{initials(profile.name, profile.email)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {profile.name || profile.email}
              {profile.role === 'ADMIN' && <Badge variant="secondary">Admin</Badge>}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Mail className="size-3.5" />
              {profile.email}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {profile.emailVerified ? (
            <div className="flex items-center gap-2 rounded-md bg-chart-3/10 px-3 py-2 text-sm text-chart-3">
              <BadgeCheck className="size-4" />
              Email verified
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-2">
                <ShieldAlert className="size-4" />
                Email not verified yet
              </span>
              <Button variant="outline" size="sm" disabled={resending} onClick={onResend}>
                {resending && <Loader2 className="size-3.5 animate-spin" />}
                Resend email
              </Button>
            </div>
          )}
          {resendMessage && <p className="mt-2 text-xs text-muted-foreground">{resendMessage}</p>}

          <Separator className="my-6" />

          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
              {savedAt && <span className="text-sm text-muted-foreground">Saved</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
