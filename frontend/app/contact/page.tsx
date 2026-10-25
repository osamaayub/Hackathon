import type { Metadata } from 'next';
import { Clock, LifeBuoy, Mail, Megaphone } from 'lucide-react';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Questions, sponsorship, organizer access or a bug to report? Send us a message.',
  alternates: { canonical: '/contact' },
};

const topics = [
  { icon: LifeBuoy, title: 'Help and support', text: 'Trouble signing in or with your team? Tell us what happened.' },
  { icon: Megaphone, title: 'Sponsorship', text: 'Interested in partnering on an event? We would love to talk.' },
  { icon: Mail, title: 'Organizers', text: 'Want to run your own hackathon here? Ask for organizer access.' },
];

export default function ContactPage() {
  return (
    <div>
      <PageHero eyebrow="Contact" title={<>Let&apos;s <span className="text-gradient">talk</span></>} description="Send us a message and we will get back to you as soon as we can." />

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-5">
        <aside className="space-y-4 md:col-span-2">
          {topics.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-sm">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-bold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
          <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            We usually reply within two working days.
          </p>
        </aside>

        <div className="md:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
