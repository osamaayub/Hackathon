import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, FileText, Gavel, Rocket, Users, Wrench, type LucideIcon } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Practical guides for hackathon participants and organizers: forming teams, shipping in 48 hours, writing submissions and judging.',
  alternates: { canonical: '/resources' },
};

interface Guide {
  id: string;
  icon: LucideIcon;
  audience: string;
  minutes: number;
  title: string;
  intro: string;
  tips: string[];
}

const guides: Guide[] = [
  {
    id: 'winning-team',
    icon: Users,
    audience: 'Participants',
    minutes: 4,
    title: 'How to build a winning team',
    intro: 'The best teams are not the ones with the most talent. They are the ones that cover the gaps and decide quickly.',
    tips: [
      'Aim for three or four people with a mix of skills: building, design and storytelling.',
      'Agree on one leader early. They break ties and keep the team moving.',
      'Say out loud what each person wants from the weekend, whether that is learning, winning or networking.',
      'Set a rule for decisions, for example "ten minutes of debate, then the leader decides".',
    ],
  },
  {
    id: 'idea-to-demo',
    icon: Clock,
    audience: 'Participants',
    minutes: 6,
    title: 'From idea to demo in 48 hours',
    intro: 'A hackathon rewards a small thing that works over a big thing that almost does.',
    tips: [
      'Spend the first two hours on scope. Write the one sentence your project does and cut everything else.',
      'Build the happy path end to end before adding features.',
      'Use the milestone tasks on your event page as checkpoints and tick them off as you go.',
      'Freeze features with a few hours left. Use that time for polish and the demo.',
    ],
  },
  {
    id: 'great-submission',
    icon: Rocket,
    audience: 'Participants',
    minutes: 3,
    title: 'Writing a submission judges remember',
    intro: 'Judges see many projects in a short time. Make yours easy to understand and easy to try.',
    tips: [
      'Lead with the problem and who has it, then show your solution.',
      'Link to a working demo or a short video, not only to the code.',
      'Keep the description short and concrete. Say what you built, not what you wanted to build.',
      'Update your submission until the deadline. You can edit the link and description any time before it.',
    ],
  },
  {
    id: 'judging',
    icon: Gavel,
    audience: 'Organizers',
    minutes: 5,
    title: 'Judging criteria that work',
    intro: 'Clear criteria make judging faster and fairer, and tell teams what to aim for.',
    tips: [
      'Publish the criteria before the event starts. Four is plenty: impact, technical quality, design and presentation.',
      'Give each criterion a simple scale and the same weight unless you have a reason not to.',
      'Have at least two judges score every project to reduce bias.',
      'Share short written feedback after the event. It is the most valued prize for many teams.',
    ],
  },
  {
    id: 'organizer-checklist',
    icon: Wrench,
    audience: 'Organizers',
    minutes: 5,
    title: 'Organizer checklist',
    intro: 'A few things to set up before you publish your event.',
    tips: [
      'Create the hackathon with clear start and end dates, a location or "Online", and a team size limit.',
      'Add the schedule: kickoff, workshops, check ins, the submission deadline and the awards.',
      'Add milestone tasks so teams can track their progress and you can see who is on track.',
      'Publish the event, share the link and watch teams form on the hackathon page.',
    ],
  },
  {
    id: 'roles',
    icon: FileText,
    audience: 'Everyone',
    minutes: 2,
    title: 'Roles and permissions explained',
    intro: 'What each kind of account can do on the platform.',
    tips: [
      'Participants can browse events, join one team per event, complete their team\'s tasks and submit a project.',
      'Team leaders are participants who created the team. They are marked with a crown.',
      'Organizers (admins) can create and edit hackathons, schedule items and tasks.',
      'Every account needs a verified email address before it can sign in.',
    ],
  },
];

export default function ResourcesPage() {
  return (
    <div>
      <PageHero eyebrow="Resources" title={<>Guides for <span className="text-gradient">builders</span> and organizers</>} description="Short, practical advice for getting more out of every hackathon." />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[16rem_1fr]">
        <nav aria-label="Guides" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">On this page</p>
          <ul className="space-y-1 border-l">
            {guides.map((g) => (
              <li key={g.id}>
                <a href={`#${g.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          {guides.map(({ id, icon: Icon, audience, minutes, title, intro, tips }) => (
            <article key={id} id={id} className="scroll-mt-28 rounded-2xl border bg-card p-7 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{audience}</span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {minutes} min read
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h2>
              <p className="mt-2 text-muted-foreground">{intro}</p>
              <ol className="mt-5 space-y-3">
                {tips.map((t, i) => (
                  <li key={t} className="flex gap-3 text-sm leading-relaxed">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}

          <div className="rounded-2xl bg-linear-to-br from-primary to-chart-2 p-8 text-center text-white">
            <h2 className="text-2xl font-extrabold">Ready to put it into practice?</h2>
            <p className="mt-2 text-white/80">Pick an event and start building with your team.</p>
            <Button asChild size="lg" className="mt-5 h-11 bg-white px-6 font-semibold text-slate-900 hover:bg-white/90">
              <Link href="/hackathons">
                Browse hackathons <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
