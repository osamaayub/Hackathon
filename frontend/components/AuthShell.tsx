import type { ReactNode } from 'react';
import { Code2, Rocket, Users } from 'lucide-react';

const perks = [
  { icon: Users, text: 'Form a team and build together' },
  { icon: Code2, text: 'Track tasks and submit your project' },
  { icon: Rocket, text: 'Ship before the countdown ends' },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-61px)] lg:grid-cols-2">
      <aside className="dark relative hidden overflow-hidden bg-background text-foreground lg:block">
        <div className="bg-grid absolute inset-0" />
        <div className="animate-float absolute -top-20 -left-20 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="animate-float absolute right-0 bottom-0 size-80 rounded-full bg-chart-2/20 blur-3xl [animation-delay:-4s]" />
        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <p className="font-mono text-sm text-chart-3">$ hackathon --start</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight">
            Where builders <span className="text-gradient">ship</span> ideas.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground">
            Join hackathons, team up with great people, and turn a weekend into a launch.
          </p>
          <ul className="mt-10 space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="glass flex items-center gap-3 rounded-xl px-4 py-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="relative flex items-center justify-center px-6 py-14">
        <div className="animate-rise w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}
