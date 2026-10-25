import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  ClipboardList,
  Crown,
  Eye,
  ListChecks,
  Rocket,
  Shield,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Team formation, live countdowns, schedules, task tracking, project submissions and admin tools. Everything a hackathon needs in one workspace.',
  alternates: { canonical: '/features' },
};

interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
}

const core: Feature[] = [
  { icon: Users, title: 'Team formation', text: 'Create a team or join one in a click. Every team shows its members and who leads it.' },
  { icon: Timer, title: 'Live countdown', text: 'A real time countdown to the deadline keeps everyone focused on shipping.' },
  { icon: Calendar, title: 'Event schedule', text: 'Kickoffs, checkpoints and demos in one timeline that organizers can update any time.' },
  { icon: ListChecks, title: 'Task tracking', text: 'Organizers publish milestones, teams tick them off, progress is visible to everyone.' },
  { icon: Rocket, title: 'Project submissions', text: 'Submit and update your project link until the deadline. A gallery shows every entry.' },
  { icon: Shield, title: 'Secure accounts', text: 'Verified email sign in, session management and role based admin controls.' },
];

const participants = [
  'Join a hackathon and form or join a team',
  'See the schedule and a countdown to the deadline',
  'Tick off milestones together with your team',
  'Submit and update your project before time runs out',
  'Earn points and badges on your profile',
];

const organizers = [
  'Publish hackathons with dates, location and team limits',
  'Add schedule items and milestone tasks in seconds',
  'Watch teams form and progress in real time',
  'Review every submission in one gallery',
  'Manage roles so only admins can change event details',
];

const lifecycle = [
  { icon: ClipboardList, phase: 'Before', title: 'Get set up', text: 'Organizers publish the event. Participants sign up, verify their email and pick a team.' },
  { icon: Timer, phase: 'During', title: 'Build and track', text: 'Follow the schedule, complete milestones and watch the countdown while you build.' },
  { icon: Eye, phase: 'After', title: 'Show and review', text: 'Teams submit their projects and everyone can browse the gallery of entries.' },
];

const faqs = [
  { q: 'Is it free to join a hackathon?', a: 'Yes. Creating an account and joining events is free.' },
  { q: 'Do I need a team to take part?', a: 'You can create your own team, or join an existing one from the hackathon page. You can leave a team at any time before the deadline.' },
  { q: 'Who can create hackathons and tasks?', a: 'Only accounts with the admin role. Participants can see everything but only edit their own team and submission.' },
  { q: 'Can I change my submission after sending it?', a: 'Yes. You can update your project link and description as many times as you like until the deadline.' },
  { q: 'Why do I need to verify my email?', a: 'Verification keeps accounts real and lets us send you important event updates.' },
];

function Check2({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Check className="size-3.5" />
      </span>
      <span>{children}</span>
    </li>
  );
}

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="dark relative isolate overflow-hidden bg-background text-foreground">
        <div className="bg-grid absolute inset-0 -z-10 opacity-50" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[26rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_45%,transparent),transparent)]" />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-28">
          <p className="animate-rise text-sm font-semibold tracking-wide text-primary uppercase">Features</p>
          <h1 className="animate-rise mt-3 text-5xl leading-[1.05] font-extrabold tracking-tight [animation-delay:80ms] sm:text-6xl">
            Built for the whole <span className="text-gradient">hackathon lifecycle</span>
          </h1>
          <p className="animate-rise mx-auto mt-5 max-w-2xl text-lg text-foreground/70 [animation-delay:160ms]">
            From the first team invite to the final submission, every step has a place. No spreadsheets, no scattered chats.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap justify-center gap-3 [animation-delay:240ms]">
            <Button asChild size="lg" className="h-12 rounded-lg px-7 text-base font-semibold">
              <Link href="/sign-up">
                Get started free <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-lg px-7 text-base font-semibold">
              <Link href="/#hackathons">Browse hackathons</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-4xl font-extrabold tracking-tight">Everything in one workspace</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Six building blocks that cover how a hackathon actually runs.</p>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {core.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group rounded-2xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-24 md:grid-cols-2">
          <div className="rounded-2xl border bg-background p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">For participants</h2>
            <ul className="mt-6 space-y-4">
              {participants.map((p) => (
                <Check2 key={p}>{p}</Check2>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-background p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Crown className="size-5" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight">For organizers</h2>
            <ul className="mt-6 space-y-4">
              {organizers.map((o) => (
                <Check2 key={o}>{o}</Check2>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Lifecycle */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-4xl font-extrabold tracking-tight">How an event flows</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {lifecycle.map(({ icon: Icon, phase, title, text }, i) => (
            <div key={phase} className="relative rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-linear-to-br from-primary to-chart-2 text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Step {i + 1}</span>
              </div>
              <p className="mt-5 text-xs font-semibold tracking-wide text-primary uppercase">{phase}</p>
              <h3 className="mt-1 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-card">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="text-center text-4xl font-extrabold tracking-tight">Frequently asked questions</h2>
          <div className="mt-12 divide-y rounded-2xl border bg-background">
            {faqs.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                  {f.q}
                  <span className="text-xl leading-none text-muted-foreground transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="dark relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-background px-8 py-16 text-center text-foreground">
          <div className="bg-grid absolute inset-0 -z-10 opacity-40" />
          <div className="absolute -top-24 left-1/2 -z-10 size-96 -translate-x-1/2 rounded-full bg-primary/40 blur-3xl" />
          <BadgeCheck className="mx-auto size-8 text-chart-3" />
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to build something great?</h2>
          <p className="mx-auto mt-3 max-w-xl text-foreground/70">Create your free account, join a team and ship your next project.</p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-12 rounded-lg px-7 text-base font-semibold">
              <Link href="/sign-up">
                Create free account <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
