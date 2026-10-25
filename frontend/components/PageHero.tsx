import type { ReactNode } from 'react';

/** Dark hero band used at the top of the secondary pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="dark relative isolate overflow-hidden bg-background text-foreground">
      <div className="bg-grid absolute inset-0 -z-10 opacity-50" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_42%,transparent),transparent)]" />
      <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-24">
        <p className="animate-rise text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
        <h1 className="animate-rise mt-3 text-4xl leading-[1.08] font-extrabold tracking-tight [animation-delay:80ms] sm:text-6xl">{title}</h1>
        {description && (
          <p className="animate-rise mx-auto mt-5 max-w-2xl text-lg text-foreground/70 [animation-delay:160ms]">{description}</p>
        )}
        {children && <div className="animate-rise mt-8 [animation-delay:240ms]">{children}</div>}
      </div>
    </section>
  );
}
