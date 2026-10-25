'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CalendarClock, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ScheduleItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ScheduleSection({ hackathonId, isAdmin }: { hackathonId: string; isAdmin: boolean }) {
  const [items, setItems] = useState<ScheduleItem[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.listSchedule(hackathonId).then(setItems).catch(() => setItems([]));
  }

  useEffect(load, [hackathonId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createScheduleItem(hackathonId, { title, time: new Date(time).toISOString() });
      setTitle('');
      setTime('');
      setDialogOpen(false);
      toast.success('Schedule item added');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      setError(message);
      toast.error('Could not add schedule item', { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await api.deleteScheduleItem(id);
      toast.success('Schedule item removed');
    } catch (err) {
      toast.error('Could not remove schedule item', { description: err instanceof Error ? err.message : undefined });
    }
    load();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-muted-foreground" />
          Schedule
        </CardTitle>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setTitle('');
                setTime('');
                setError(null);
              }
            }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="size-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={onCreate}>
                <DialogHeader>
                  <DialogTitle>Add schedule item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-title">Title</Label>
                    <Input id="sched-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-time">Time</Label>
                    <Input
                      id="sched-time"
                      type="datetime-local"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Add
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {items === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {items?.length === 0 && <p className="text-sm text-muted-foreground">No schedule items yet.</p>}
        <ul className="space-y-2">
          {items?.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{formatTime(item.time)}</p>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="icon" className="size-7" onClick={() => onDelete(item.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
