import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Megaphone, Sparkles, Target, Users } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sponsors',
  description: 'Partner with Hackathon to reach builders, recruit talent and showcase your product at our events.',
  alternates: { canonical: '/sponsors' },
};

const reasons = [
  { icon: Users, title: 'Reach builders', text: 'Put your product in front of motivated developers and designers while they are actively building.' },
  { icon: Target, title: 'Find talent', text: 'See real projects from real teams. It is the best portfolio review you can get.' },
  { icon: Megaphone, title: 'Show up where it counts', text: 'Sponsor challenges, mentor teams and be part of the story people tell about the event.' },
];

const tiers = [
  {
    name: 'Community',
    blurb: 'Support an event and get seen.',
    perks: ['Logo on the event page', 'Mention in the announcement', 'Access to the project gallery'],
    featured: false,
  },
  {
    name: 'Partner',
    blurb: 'Run a challenge and meet the teams.',
    perks: ['Everything in Community', 'A sponsored challenge or prize track', 'Mentor slot during the event', 'Judging seat'],
    featured: true,
  },
  {
    name: 'Title',
    blurb: 'Make the event yours.',
    perks: ['Everything in Partner', 'Event named with your brand', 'Keynote or workshop slot', 'First look at all submissions'],
    featured: false,
  },
];

export default function SponsorsPage() {
  return (
    <div>
      <PageHero
        eyebrow="Sponsors"
        title={<>Partner with the <span className="text-gradient">builders</span></>}
        description="Support a hackathon, meet great teams and help great projects get built."
      >
        <Button asChild size="lg" className="h-12 rounded-lg px-7 text-base font-semibold">
          <Link href="/contact?topic=sponsorship">
            Become a sponsor <ArrowRight />
          </Link>
        </Button>
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-4xl font-extrabold tracking-tight">Why sponsor</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-center text-4xl font-extrabold tracking-tight">Sponsorship tiers</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">Every package is tailored to the event. Tell us your goals and we will shape it together.</p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.name} className={`relative flex flex-col rounded-2xl border bg-background p-7 ${t.featured ? 'border-primary shadow-xl shadow-primary/10 md:-translate-y-2' : ''}`}>
                {t.featured && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    <Sparkles className="size-3" /> Most popular
                  </span>
                )}
                <h3 className="text-xl font-extrabold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Check className="size-3.5" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={t.featured ? 'default' : 'outline'} size="lg" className="mt-8 w-full">
                  <Link href={`/contact?topic=sponsorship`}>Talk to us</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
