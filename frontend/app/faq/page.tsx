import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers to common questions about joining hackathons, forming teams, submitting projects and running events.',
  alternates: { canonical: '/faq' },
};

const groups = [
  {
    title: 'Getting started',
    items: [
      ['Is it free to join a hackathon?', 'Yes. Creating an account and joining events is free.'],
      ['Why do I need to verify my email?', 'Verification keeps accounts real and lets us send you important event updates. You will get a link right after you sign up.'],
      ['I did not get the verification email. What now?', 'Check your spam folder, then open your profile and choose "Resend email". If it still does not arrive, contact us.'],
    ],
  },
  {
    title: 'Teams',
    items: [
      ['Do I need a team to take part?', 'You can create your own team or join an existing one from the hackathon page. You can leave a team at any time.'],
      ['How big can a team be?', 'Each event sets its own maximum team size. You can see it on the hackathon page, and full teams show as full.'],
      ['Can I be on more than one team?', 'You can join one team per hackathon, but you can take part in as many hackathons as you like.'],
    ],
  },
  {
    title: 'Projects and judging',
    items: [
      ['How do I submit my project?', 'Open your hackathon, scroll to Project submissions and add your project link and a short description. Any team member can submit.'],
      ['Can I change my submission after sending it?', 'Yes. You can update your link and description as many times as you like until the deadline.'],
      ['What happens after the deadline?', 'Submissions lock, and every project appears in the public Projects gallery.'],
    ],
  },
  {
    title: 'Organizers',
    items: [
      ['Who can create hackathons, tasks and schedule items?', 'Only accounts with the organizer (admin) role. Participants can see everything but only edit their own team and submission.'],
      ['How do I become an organizer?', 'Organizer access is granted by an existing admin. Contact us and tell us about your event.'],
    ],
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: groups.flatMap((g) =>
    g.items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  ),
};

export default function FaqPage() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero eyebrow="FAQ" title={<>Questions, <span className="text-gradient">answered</span></>} description="Everything you need to know before your first hackathon." />

      <div className="mx-auto max-w-3xl space-y-12 px-6 py-20">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-4 text-xl font-extrabold tracking-tight">{g.title}</h2>
            <div className="divide-y rounded-2xl border bg-card shadow-sm">
              {g.items.map(([q, a]) => (
                <details key={q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                    {q}
                    <span className="text-xl leading-none text-muted-foreground transition group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <p className="text-center text-sm text-muted-foreground">
          Still stuck?{' '}
          <Link href="/contact" className="font-medium text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
