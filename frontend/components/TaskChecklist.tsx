'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function TaskChecklist({
  hackathonId,
  isAdmin,
  inTeam,
}: {
  hackathonId: string;
  isAdmin: boolean;
  inTeam: boolean;
}) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function load() {
    api.listTasks(hackathonId).then(setTasks).catch(() => setTasks([]));
  }

  useEffect(load, [hackathonId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createTask(hackathonId, { title });
      setTitle('');
      setDialogOpen(false);
      toast.success('Task added');
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add task';
      setError(message);
      toast.error('Could not add task', { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(task: Task) {
    setPendingId(task.id);
    try {
      if (task.completedByMyTeam) {
        await api.uncompleteTask(task.id);
        toast.info('Task marked incomplete');
      } else {
        await api.completeTask(task.id);
        toast.success('Task completed', { description: task.title });
      }
      load();
    } catch (err) {
      toast.error('Could not update task', { description: err instanceof Error ? err.message : undefined });
      load();
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(id: string) {
    try {
      await api.deleteTask(id);
      toast.success('Task removed');
    } catch (err) {
      toast.error('Could not remove task', { description: err instanceof Error ? err.message : undefined });
    }
    load();
  }

  const done = tasks?.filter((t) => t.completedByMyTeam).length ?? 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="size-4 text-muted-foreground" />
          Tasks
          {tasks && tasks.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {done}/{tasks.length}
            </span>
          )}
        </CardTitle>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setTitle('');
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
                  <DialogTitle>Add a task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="task-title">Title</Label>
                    <Input id="task-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
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
        {tasks === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {tasks?.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
        <ul className="space-y-1">
          {tasks?.map((task) => (
            <li key={task.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
              <Checkbox
                checked={task.completedByMyTeam}
                disabled={!inTeam || pendingId === task.id}
                onCheckedChange={() => onToggle(task)}
              />
              <span className={`flex-1 text-sm ${task.completedByMyTeam ? 'text-muted-foreground line-through' : ''}`}>
                {task.title}
              </span>
              {isAdmin && (
                <Button variant="ghost" size="icon" className="size-7" onClick={() => onDelete(task.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {!inTeam && tasks && tasks.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Join a team to check off tasks.</p>
        )}
      </CardContent>
    </Card>
  );
}
