import { cn } from '@/lib/utils';

interface DirectionShellProps {
  label: string;
  name: string;
  thesis: string;
  borrows: string[];
  rejects: string[];
  tradeoff: string;
  children: React.ReactNode;
  tone?: 'default' | 'muted';
}

export function DirectionShell({
  label,
  name,
  thesis,
  borrows,
  rejects,
  tradeoff,
  children,
  tone = 'default',
}: DirectionShellProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border-subtle p-5 sm:p-6',
        tone === 'muted' ? 'bg-surface-page' : 'bg-surface-raised',
      )}
    >
      <header className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 font-sans text-overline font-bold uppercase tracking-[0.06em] text-primary">
            {label}
          </span>
          <h2 className="font-sans text-lg font-bold leading-tight text-foreground">{name}</h2>
        </div>
        <p className="font-sans text-sm italic text-muted-foreground">{thesis}</p>
        <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Borrows
            </dt>
            <dd className="mt-0.5 font-sans text-xs text-foreground">{borrows.join(' · ')}</dd>
          </div>
          <div>
            <dt className="font-sans text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Rejects
            </dt>
            <dd className="mt-0.5 font-sans text-xs text-foreground">{rejects.join(' · ')}</dd>
          </div>
        </dl>
      </header>
      <div className="mx-auto flex max-w-sm flex-col gap-4">{children}</div>
      <footer className="mx-auto mt-6 max-w-sm border-t border-border-subtle pt-3">
        <p className="font-sans text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Trade-off.</span> {tradeoff}
        </p>
      </footer>
    </section>
  );
}
