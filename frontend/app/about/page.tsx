import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Eye, Handshake, Zap } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why we built Hackathon: a calm, fast home for teams to form, build and ship together.',
  alternates: { canonical: '/about' },
};

const values = [
  { icon: Zap, title: 'Fast to start', text: 'Sign up, join a team and see the schedule in minutes. No setup, no spreadsheets.' },
  { icon: Eye, title: 'Clear for everyone', text: 'Participants, mentors and organizers all see the same schedule, tasks and submissions.' },
  { icon: Handshake, title: 'Built for teams', text: 'Teams are first class: leaders, members, shared milestones and one project submission.' },
];

const stack = ['NestJS', 'Next.js', 'PostgreSQL', 'Prisma', 'Better Auth', 'Arcjet', 'Resend', 'Tailwind CSS'];

export default function AboutPage() {
  return (
    <div>
      <PageHero
        eyebrow="About"
        title={<>A calmer way to run <span className="text-gradient">hackathons</span></>}
        description="Hackathons are at their best when everyone knows what is happening and teams can focus on building. That is the whole idea."
      />

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Our mission</p>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight">Less admin. More shipping.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Running or joining a hackathon usually means a dozen tabs: a chat for announcements, a sheet for teams, a form for submissions and a
            countdown on someone&apos;s phone. We bring all of it into one workspace, so organizers can run a smooth event and participants can spend
            their time on the project.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Every event has a live countdown, a schedule, milestone tasks, teams and a public gallery of what everyone built.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Teams', 'Form, join and lead'],
            ['Schedule', 'One shared timeline'],
            ['Tasks', 'Milestones that track progress'],
            ['Projects', 'A gallery of everything shipped'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <p className="text-lg font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-4xl font-extrabold tracking-tight">What we care about</h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-background p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Built with modern, reliable tools</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {stack.map((s) => (
            <span key={s} className="rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-sm">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-lg px-7 text-base font-semibold">
            <Link href="/sign-up">
              Join a hackathon <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 rounded-lg px-7 text-base font-semibold">
            <Link href="/contact">Get in touch</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
