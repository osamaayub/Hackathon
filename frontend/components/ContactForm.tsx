'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const topics = [
  { value: 'general', label: 'General question' },
  { value: 'support', label: 'Help and support' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'organizer', label: 'Organizer access' },
  { value: 'bug', label: 'Report a bug' },
];

const MAX_MESSAGE = 2000;

export function ContactForm() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preselect the topic from a link such as /contact?topic=sponsorship.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('topic');
    if (t && topics.some((x) => x.value === t)) setTopic(t);
  }, []);

  // Prefill from the signed in account, without overwriting what the user typed.
  useEffect(() => {
    if (!user) return;
    setName((n) => n || user.name || '');
    setEmail((e) => e || user.email);
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.sendContactMessage({ name, email, topic, message });
      toast.success('Message sent', { description: 'Thanks for reaching out. We will reply by email.' });
      setMessage('');
      setSent(true);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Could not send your message';
      setError(text);
      toast.error('Could not send message', { description: text });
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center shadow-sm">
        <span className="grid size-14 place-items-center rounded-2xl bg-chart-3/15 text-chart-3">
          <CheckCircle2 className="size-7" />
        </span>
        <h2 className="text-2xl font-extrabold">Message sent</h2>
        <p className="max-w-sm text-sm text-muted-foreground">Thank you. We will get back to you at {email}.</p>
        <Button variant="outline" className="mt-2" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-7 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input id="c-name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" placeholder="Ada Lovelace" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" placeholder="you@example.com" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-topic">Topic</Label>
        <select
          id="c-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="c-message">Message</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {message.length}/{MAX_MESSAGE}
          </span>
        </div>
        <Textarea id="c-message" required minLength={10} maxLength={MAX_MESSAGE} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto">
        {sending ? <Loader2 className="animate-spin" /> : <Send />}
        {sending ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
