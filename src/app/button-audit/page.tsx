import { Button } from '@/components/ui/button';
import {
  DotsThreeOutline,
  PaperPlaneTilt,
  PencilSimple,
  Check,
  X,
  PushPin,
  Trash,
  ArrowClockwise,
  Plus,
  LinkSimple,
  EnvelopeSimple,
  GearSix,
  User,
  SignOut,
  UserPlus,
  HandWaving,
  Copy,
  MagnifyingGlass,
} from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link' | 'dynamic';
type Size = 'xs' | 'sm' | 'default' | 'lg' | 'icon' | 'icon-sm';

interface Row {
  area: string;
  file: string;
  label: string;
  sublabel?: string;
  variant: Variant;
  size: Size;
  mobile: ContextKey;
  desktop: ContextKey;
  notes: string;
  preview?: ReactNode;
}

type ContextKey =
  | 'fullwidth'
  | 'fixed'
  | 'sticky'
  | 'visible'
  | 'hidden'
  | 'inline'
  | 'dialog'
  | 'drawer'
  | 'popover';

const sizeMeta: Record<Size, { px: string; label: string }> = {
  xs: { px: '28px', label: 'xs' },
  sm: { px: '32px', label: 'sm' },
  default: { px: '40px', label: 'default' },
  lg: { px: '44px', label: 'lg' },
  icon: { px: '40px²', label: 'icon' },
  'icon-sm': { px: '32px²', label: 'icon-sm' },
};

const variantClasses: Record<Variant, string> = {
  default: 'bg-blue-100 text-blue-900 ring-1 ring-inset ring-blue-200',
  outline: 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-300',
  ghost: 'bg-zinc-50 text-zinc-600 ring-1 ring-inset ring-zinc-200',
  destructive: 'bg-red-100 text-red-900 ring-1 ring-inset ring-red-200',
  secondary: 'bg-sky-100 text-sky-900 ring-1 ring-inset ring-sky-200',
  link: 'bg-transparent text-blue-700 underline underline-offset-2',
  dynamic: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200 italic',
};

const sizeChipClasses: Record<Size, string> = {
  xs: 'bg-zinc-50 text-zinc-500 ring-1 ring-inset ring-zinc-200',
  sm: 'bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200',
  default: 'bg-zinc-200 text-zinc-700 ring-1 ring-inset ring-zinc-300',
  lg: 'bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200',
  icon: 'bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-200',
  'icon-sm': 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
};

const contextMeta: Record<ContextKey, { label: string; dot: string; text: string }> = {
  fullwidth: { label: 'full-width', dot: 'bg-indigo-500', text: 'text-indigo-700' },
  fixed: { label: 'fixed bottom', dot: 'bg-amber-500', text: 'text-amber-700' },
  sticky: { label: 'sticky bar', dot: 'bg-cyan-500', text: 'text-cyan-700' },
  visible: { label: 'visible', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  hidden: { label: 'hidden', dot: 'bg-zinc-300', text: 'text-zinc-400' },
  inline: { label: 'inline', dot: 'bg-zinc-400', text: 'text-zinc-600' },
  dialog: { label: 'dialog', dot: 'bg-purple-500', text: 'text-purple-700' },
  drawer: { label: 'drawer', dot: 'bg-pink-500', text: 'text-pink-700' },
  popover: { label: 'popover', dot: 'bg-teal-500', text: 'text-teal-700' },
};

// Render the *actual* Button to show what it looks like in real life.
// Falls back to a small placeholder for dynamic variant.
function LivePreview({
  variant,
  size,
  label,
  icon,
  iconOnly,
}: {
  variant: Variant;
  size: Size;
  label: string;
  icon?: ReactNode;
  iconOnly?: boolean;
}) {
  if (variant === 'dynamic') {
    return <span className="text-overline italic text-muted-foreground">— state-driven —</span>;
  }
  if (iconOnly) {
    return (
      <Button variant={variant} size={size} aria-label={label}>
        {icon}
      </Button>
    );
  }
  return (
    <Button variant={variant} size={size}>
      {icon}
      {label}
    </Button>
  );
}

export default function ButtonAuditPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Button Audit — Draftr</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{'<Button>'}</code> in
            the codebase · variant · size · mobile &amp; desktop context · live preview
          </p>
        </header>

        {/* Legend */}
        <section className="mb-8 rounded-xl border border-border bg-card p-5 shadow-xs">
          <div className="grid gap-5 md:grid-cols-3">
            <LegendBlock title="Variants">
              {(
                [
                  'default',
                  'outline',
                  'ghost',
                  'destructive',
                  'secondary',
                  'link',
                  'dynamic',
                ] as Variant[]
              ).map((v) => (
                <span
                  key={v}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${variantClasses[v]}`}
                >
                  {v}
                </span>
              ))}
            </LegendBlock>

            <LegendBlock title="Sizes">
              {(['xs', 'sm', 'default', 'lg', 'icon', 'icon-sm'] as Size[]).map((s) => (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${sizeChipClasses[s]}`}
                >
                  {sizeMeta[s].label}
                  <span className="font-normal opacity-60">{sizeMeta[s].px}</span>
                </span>
              ))}
            </LegendBlock>

            <LegendBlock title="Context">
              {(Object.keys(contextMeta) as ContextKey[]).map((c) => (
                <span
                  key={c}
                  className={`inline-flex items-center gap-1.5 text-[11px] ${contextMeta[c].text}`}
                >
                  <span className={`size-1.5 rounded-full ${contextMeta[c].dot}`} />
                  {contextMeta[c].label}
                </span>
              ))}
            </LegendBlock>
          </div>
        </section>

        {/* Data table — grouped by section */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">Area</th>
                <th className="px-4 py-3 text-left font-semibold">File</th>
                <th className="px-4 py-3 text-left font-semibold">Label</th>
                <th className="px-4 py-3 text-left font-semibold">Variant</th>
                <th className="px-4 py-3 text-left font-semibold">Size</th>
                <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                <th className="px-4 py-3 text-left font-semibold">Desktop</th>
                <th className="px-4 py-3 text-left font-semibold">Live</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <SectionGroup key={section.title} section={section} />
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground/60">
          src/app/button-audit/page.tsx · {sections.reduce((sum, s) => sum + s.rows.length, 0)}{' '}
          buttons catalogued
        </p>
      </div>
    </main>
  );
}

function LegendBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function SectionGroup({ section }: { section: { title: string; rows: Row[] } }) {
  return (
    <>
      <tr>
        <td
          colSpan={9}
          className="border-y border-border bg-muted/30 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground"
        >
          {section.title}
        </td>
      </tr>
      {section.rows.map((row, i) => (
        <RowItem key={`${section.title}-${i}`} row={row} />
      ))}
    </>
  );
}

function RowItem({ row }: { row: Row }) {
  return (
    <tr className="border-b border-border/50 transition-colors hover:bg-muted/20">
      <td className="px-4 py-3 align-middle">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {row.area}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span className="font-mono text-[11px] text-muted-foreground">{row.file}</span>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="font-medium text-foreground">{row.label}</div>
        {row.sublabel && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{row.sublabel}</div>
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${variantClasses[row.variant]}`}
        >
          {row.variant}
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${sizeChipClasses[row.size]}`}
        >
          {sizeMeta[row.size].label}
          <span className="font-normal opacity-60">{sizeMeta[row.size].px}</span>
        </span>
      </td>
      <td className="px-4 py-3 align-middle">
        <ContextBadge context={row.mobile} />
      </td>
      <td className="px-4 py-3 align-middle">
        <ContextBadge context={row.desktop} />
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center">{row.preview}</div>
      </td>
      <td className="max-w-[280px] px-4 py-3 align-middle">
        <p className="text-[11px] leading-relaxed text-muted-foreground">{row.notes}</p>
      </td>
    </tr>
  );
}

function ContextBadge({ context }: { context: ContextKey }) {
  const meta = contextMeta[context];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] ${meta.text}`}>
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Data — every Button in the codebase
// ──────────────────────────────────────────────────────────────────────────

const sections: { title: string; rows: Row[] }[] = [
  {
    title: 'Auth',
    rows: [
      {
        area: 'Auth',
        file: 'auth/sign-in-form.tsx',
        label: 'Sign In',
        sublabel: 'or "Loading…"',
        variant: 'default',
        size: 'default',
        mobile: 'fullwidth',
        desktop: 'fullwidth',
        notes: 'type=submit · w-full · isPending disables',
        preview: <LivePreview variant="default" size="default" label="Sign In" />,
      },
      {
        area: 'Auth',
        file: 'auth/profile-setup-form.tsx',
        label: 'Continue',
        sublabel: 'or "Loading…"',
        variant: 'default',
        size: 'default',
        mobile: 'fullwidth',
        desktop: 'fullwidth',
        notes: 'type=submit · w-full · isPending disables',
        preview: <LivePreview variant="default" size="default" label="Continue" />,
      },
    ],
  },
  {
    title: 'Ride Feed / Cards',
    rows: [
      {
        area: 'Ride Feed',
        file: 'rides/card-signup-button.tsx',
        label: 'Join Ride',
        sublabel: 'or "Join Waitlist"',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'shrink-0 · SpinnerGap when pending · hidden when already signed up',
        preview: <LivePreview variant="default" size="sm" label="Join Ride" />,
      },
    ],
  },
  {
    title: 'My Schedule / Dashboard',
    rows: [
      {
        area: 'Schedule',
        file: 'rides/schedule-card.tsx',
        label: 'Cancel Signup',
        variant: 'ghost',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'text-muted-foreground · confirmed status only',
        preview: <LivePreview variant="ghost" size="sm" label="Cancel Signup" />,
      },
      {
        area: 'Schedule',
        file: 'rides/schedule-card.tsx',
        label: 'Leave Waitlist',
        variant: 'ghost',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'text-warning · waitlisted status only',
        preview: <LivePreview variant="ghost" size="sm" label="Leave Waitlist" />,
      },
      {
        area: 'Schedule',
        file: 'rides/schedule-card.tsx',
        label: 'Get Directions',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: '<a> via buttonVariants · ml-auto · external link',
        preview: <LivePreview variant="default" size="sm" label="Get Directions" />,
      },
      {
        area: 'Dashboard',
        file: 'app/(app)/page.tsx',
        label: 'Browse Rides',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'inside <Link> · only when no rides',
        preview: <LivePreview variant="default" size="sm" label="Browse Rides" />,
      },
      {
        area: 'Schedule',
        file: 'my-schedule-sections.tsx',
        label: 'Browse Rides',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'inside <Link> · upcoming tab empty',
        preview: <LivePreview variant="default" size="sm" label="Browse Rides" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Full-Width Signup',
    rows: [
      {
        area: 'Ride Detail',
        file: 'rides/signup-button.tsx',
        label: 'Ride Cancelled',
        sublabel: '(disabled)',
        variant: 'secondary',
        size: 'lg',
        mobile: 'fullwidth',
        desktop: 'fullwidth',
        notes: 'w-full · always disabled · cancelled state only',
        preview: (
          <Button variant="secondary" size="lg" disabled>
            Ride Cancelled
          </Button>
        ),
      },
      {
        area: 'Ride Detail',
        file: 'rides/signup-button.tsx',
        label: 'Cancel Signup',
        variant: 'outline',
        size: 'lg',
        mobile: 'fullwidth',
        desktop: 'fullwidth',
        notes: 'w-full · confirmed status only',
        preview: <LivePreview variant="outline" size="lg" label="Cancel Signup" />,
      },
      {
        area: 'Ride Detail',
        file: 'rides/signup-button.tsx',
        label: 'Sign Up',
        variant: 'default',
        size: 'lg',
        mobile: 'fullwidth',
        desktop: 'fullwidth',
        notes: 'w-full · HandWaving icon inline-start · not-full state',
        preview: (
          <LivePreview
            variant="default"
            size="lg"
            label="Sign Up"
            icon={<HandWaving className="size-4" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Ride Detail',
        file: 'rides/signup-button.tsx',
        label: 'Join Waitlist',
        variant: 'default',
        size: 'lg',
        mobile: 'fullwidth',
        desktop: 'fullwidth',
        notes: 'w-full · ride-full state',
        preview: <LivePreview variant="default" size="lg" label="Join Waitlist" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Mobile Floating Action Bar',
    rows: [
      {
        area: 'Action Bar',
        file: 'rides/ride-action-bar.tsx',
        label: 'Sign Up / Leave / Full',
        sublabel: '(dynamic label)',
        variant: 'dynamic',
        size: 'sm',
        mobile: 'fixed',
        desktop: 'hidden',
        notes: 'variant from state.ctaVariant · max-w-lg · md:hidden',
        preview: <LivePreview variant="dynamic" size="sm" label="" />,
      },
      {
        area: 'Action Bar',
        file: 'rides/ride-action-bar.tsx',
        label: 'Cancel',
        sublabel: '(confirm-leave mode)',
        variant: 'outline',
        size: 'sm',
        mobile: 'fixed',
        desktop: 'hidden',
        notes: 'shown only in confirm-leave mode · md:hidden',
        preview: <LivePreview variant="outline" size="sm" label="Cancel" />,
      },
      {
        area: 'Action Bar',
        file: 'rides/ride-action-bar.tsx',
        label: 'Leave / Leave Waitlist',
        sublabel: '(confirm-leave mode)',
        variant: 'destructive',
        size: 'sm',
        mobile: 'fixed',
        desktop: 'hidden',
        notes: 'shown only in confirm-leave mode · md:hidden',
        preview: <LivePreview variant="destructive" size="sm" label="Leave" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Desktop Sticky Action Strip',
    rows: [
      {
        area: 'Action Strip',
        file: 'rides/ride-action-strip.tsx',
        label: 'Sign Up / Leave / Full',
        sublabel: '(dynamic label)',
        variant: 'dynamic',
        size: 'sm',
        mobile: 'hidden',
        desktop: 'sticky',
        notes: 'variant from state.ctaVariant · hidden md:block',
        preview: <LivePreview variant="dynamic" size="sm" label="" />,
      },
      {
        area: 'Action Strip',
        file: 'rides/ride-action-strip.tsx',
        label: 'Cancel',
        sublabel: '(confirm-leave mode)',
        variant: 'outline',
        size: 'sm',
        mobile: 'hidden',
        desktop: 'sticky',
        notes: 'confirm-leave mode only · hidden md:block',
        preview: <LivePreview variant="outline" size="sm" label="Cancel" />,
      },
      {
        area: 'Action Strip',
        file: 'rides/ride-action-strip.tsx',
        label: 'Leave / Leave Waitlist',
        variant: 'destructive',
        size: 'sm',
        mobile: 'hidden',
        desktop: 'sticky',
        notes: 'confirm-leave mode only · hidden md:block',
        preview: <LivePreview variant="destructive" size="sm" label="Leave" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Sole Leader Dialog',
    rows: [
      {
        area: 'Sole Leader',
        file: 'rides/sole-leader-dialog.tsx',
        label: 'Add Co-Leader',
        variant: 'default',
        size: 'default',
        mobile: 'drawer',
        desktop: 'dialog',
        notes: 'navigates to edit form · options step',
        preview: <LivePreview variant="default" size="default" label="Add Co-Leader" />,
      },
      {
        area: 'Sole Leader',
        file: 'rides/sole-leader-dialog.tsx',
        label: 'Cancel Ride',
        variant: 'destructive',
        size: 'default',
        mobile: 'drawer',
        desktop: 'dialog',
        notes: 'advances to confirm-cancel step',
        preview: <LivePreview variant="destructive" size="default" label="Cancel Ride" />,
      },
      {
        area: 'Sole Leader',
        file: 'rides/sole-leader-dialog.tsx',
        label: 'Dismiss',
        variant: 'ghost',
        size: 'default',
        mobile: 'drawer',
        desktop: 'dialog',
        notes: 'DrawerClose asChild · options step',
        preview: <LivePreview variant="ghost" size="default" label="Dismiss" />,
      },
      {
        area: 'Sole Leader',
        file: 'rides/sole-leader-dialog.tsx',
        label: 'Confirm Cancel Ride',
        variant: 'destructive',
        size: 'default',
        mobile: 'drawer',
        desktop: 'dialog',
        notes: 'confirm-cancel step · isPending disables',
        preview: <LivePreview variant="destructive" size="default" label="Confirm" />,
      },
      {
        area: 'Sole Leader',
        file: 'rides/sole-leader-dialog.tsx',
        label: 'Dismiss',
        sublabel: '(confirm step)',
        variant: 'ghost',
        size: 'default',
        mobile: 'drawer',
        desktop: 'dialog',
        notes: 'back to options step',
        preview: <LivePreview variant="ghost" size="default" label="Dismiss" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Kebab Menu',
    rows: [
      {
        area: 'Kebab',
        file: 'rides/ride-kebab-menu.tsx',
        label: 'Menu trigger',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'DotsThreeOutline · opens DropdownMenu',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Menu"
            iconOnly
            icon={<DotsThreeOutline className="size-4" weight="fill" />}
          />
        ),
      },
      {
        area: 'Kebab',
        file: 'rides/ride-kebab-menu.tsx',
        label: 'Cancel',
        sublabel: '(in alert dialog)',
        variant: 'outline',
        size: 'sm',
        mobile: 'dialog',
        desktop: 'dialog',
        notes: 'AlertDialogClose · dismiss confirmation',
        preview: <LivePreview variant="outline" size="sm" label="Cancel" />,
      },
      {
        area: 'Kebab',
        file: 'rides/ride-kebab-menu.tsx',
        label: 'Cancel Ride / Delete',
        variant: 'destructive',
        size: 'sm',
        mobile: 'dialog',
        desktop: 'dialog',
        notes: 'confirm destructive action',
        preview: <LivePreview variant="destructive" size="sm" label="Delete" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Comments',
    rows: [
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Send',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'absolute bottom-right of textarea · PaperPlaneTilt',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon"
            label="Send"
            iconOnly
            icon={<PaperPlaneTilt className="size-4" />}
          />
        ),
      },
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Edit',
        variant: 'link',
        size: 'xs',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'own comments only · text-muted-foreground',
        preview: <LivePreview variant="link" size="xs" label="Edit" />,
      },
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Delete',
        variant: 'link',
        size: 'xs',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'own + admin · hover:text-destructive',
        preview: <LivePreview variant="link" size="xs" label="Delete" />,
      },
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Save',
        sublabel: '(edit mode)',
        variant: 'default',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'disabled when body empty or pending',
        preview: <LivePreview variant="default" size="sm" label="Save" />,
      },
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Cancel',
        sublabel: '(edit mode)',
        variant: 'ghost',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'resets body to original',
        preview: <LivePreview variant="ghost" size="sm" label="Cancel" />,
      },
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Cancel',
        sublabel: '(delete dialog)',
        variant: 'outline',
        size: 'sm',
        mobile: 'dialog',
        desktop: 'dialog',
        notes: 'AlertDialogClose · dismiss delete confirm',
        preview: <LivePreview variant="outline" size="sm" label="Cancel" />,
      },
      {
        area: 'Comments',
        file: 'rides/ride-comments.tsx',
        label: 'Delete',
        sublabel: '(delete dialog)',
        variant: 'destructive',
        size: 'sm',
        mobile: 'dialog',
        desktop: 'dialog',
        notes: 'Loading… when pending',
        preview: <LivePreview variant="destructive" size="sm" label="Delete" />,
      },
    ],
  },
  {
    title: 'Ride Detail — Signup Roster',
    rows: [
      {
        area: 'Roster',
        file: 'rides/signup-roster.tsx',
        label: 'Remove',
        variant: 'link',
        size: 'xs',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'leader/admin only · text-muted → hover:text-destructive',
        preview: <LivePreview variant="link" size="xs" label="Remove" />,
      },
    ],
  },
  {
    title: 'Ride Edit — Cancel Ride',
    rows: [
      {
        area: 'Edit Ride',
        file: 'rides/cancel-ride-button.tsx',
        label: 'Cancel This Ride',
        sublabel: '(text trigger)',
        variant: 'link',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'text-destructive · leaders only',
        preview: <LivePreview variant="link" size="sm" label="Cancel This Ride" />,
      },
      {
        area: 'Edit Ride',
        file: 'rides/cancel-ride-button.tsx',
        label: 'Cancel Ride',
        sublabel: '(in confirm callout)',
        variant: 'destructive',
        size: 'default',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'no size prop = default · Loading… when pending',
        preview: <LivePreview variant="destructive" size="default" label="Cancel Ride" />,
      },
      {
        area: 'Edit Ride',
        file: 'rides/cancel-ride-button.tsx',
        label: 'Keep Ride',
        variant: 'outline',
        size: 'default',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'no size prop = default · dismisses callout',
        preview: <LivePreview variant="outline" size="default" label="Keep Ride" />,
      },
    ],
  },
  {
    title: 'Ride Form — Steps',
    rows: [
      {
        area: 'Form',
        file: 'form-steps/step-route.tsx',
        label: 'Clear Route',
        variant: 'ghost',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'shown when route is set',
        preview: <LivePreview variant="ghost" size="sm" label="Clear Route" />,
      },
      {
        area: 'Form',
        file: 'form-steps/step-route.tsx',
        label: 'Import / Select Route',
        variant: 'ghost',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'opens route import drawer',
        preview: <LivePreview variant="ghost" size="sm" label="Import Route" />,
      },
      {
        area: 'Form',
        file: 'form-steps/step-route.tsx',
        label: 'Location picker',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'location picker trigger',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon"
            label="Pick"
            iconOnly
            icon={<MagnifyingGlass className="size-4" />}
          />
        ),
      },
      {
        area: 'Form',
        file: 'rides/co-leader-picker.tsx',
        label: 'Add Co-Leader',
        variant: 'outline',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'UserPlus icon · opens picker',
        preview: (
          <LivePreview
            variant="outline"
            size="sm"
            label="Add Co-Leader"
            icon={<UserPlus className="size-4" data-icon="inline-start" />}
          />
        ),
      },
    ],
  },
  {
    title: 'Route Import (in drawer)',
    rows: [
      {
        area: 'Route Import',
        file: 'rides/route-import-inline.tsx',
        label: 'Add Route',
        sublabel: 'or SpinnerGap when loading',
        variant: 'outline',
        size: 'default',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'w-full · LinkSimple icon · URL paste tab',
        preview: (
          <LivePreview
            variant="outline"
            size="default"
            label="Add Route"
            icon={<LinkSimple className="size-4" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Route Import',
        file: 'rides/route-import-inline.tsx',
        label: 'Retry',
        variant: 'outline',
        size: 'sm',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'ArrowClockwise icon · error state only',
        preview: (
          <LivePreview
            variant="outline"
            size="sm"
            label="Retry"
            icon={<ArrowClockwise className="size-4" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Route Import',
        file: 'rides/route-import-inline.tsx',
        label: 'Load More',
        variant: 'ghost',
        size: 'sm',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'pagination at bottom of route list',
        preview: <LivePreview variant="ghost" size="sm" label="Load More" />,
      },
    ],
  },
  {
    title: 'Layout — Avatar Menu',
    rows: [
      {
        area: 'Avatar Menu',
        file: 'layout/avatar-menu.tsx',
        label: 'My Profile',
        variant: 'ghost',
        size: 'lg',
        mobile: 'drawer',
        desktop: 'hidden',
        notes: 'w-full justify-start · User icon · DrawerClose asChild',
        preview: (
          <LivePreview
            variant="ghost"
            size="lg"
            label="My Profile"
            icon={<User className="size-5" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Avatar Menu',
        file: 'layout/avatar-menu.tsx',
        label: 'Settings',
        variant: 'ghost',
        size: 'lg',
        mobile: 'drawer',
        desktop: 'hidden',
        notes: 'w-full justify-start · GearSix icon · DrawerClose asChild',
        preview: (
          <LivePreview
            variant="ghost"
            size="lg"
            label="Settings"
            icon={<GearSix className="size-5" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Avatar Menu',
        file: 'layout/avatar-menu.tsx',
        label: 'Sign Out',
        variant: 'destructive',
        size: 'lg',
        mobile: 'drawer',
        desktop: 'hidden',
        notes: 'w-full justify-start · SignOut icon · DrawerClose asChild',
        preview: (
          <LivePreview
            variant="destructive"
            size="lg"
            label="Sign Out"
            icon={<SignOut className="size-5" data-icon="inline-start" />}
          />
        ),
      },
    ],
  },
  {
    title: 'Layout — Notification Bell',
    rows: [
      {
        area: 'Notif. Bell',
        file: 'layout/notification-bell.tsx',
        label: 'Mark all as read',
        variant: 'link',
        size: 'sm',
        mobile: 'hidden',
        desktop: 'popover',
        notes: 'text-xs text-muted-foreground · desktop popover only',
        preview: <LivePreview variant="link" size="sm" label="Mark all as read" />,
      },
    ],
  },
  {
    title: 'Profile — Inline Editing',
    rows: [
      {
        area: 'Profile',
        file: 'profile/inline-edit-actions.tsx',
        label: 'Cancel',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'X icon · shared across all profile section editors',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Cancel"
            iconOnly
            icon={<X className="size-4" />}
          />
        ),
      },
      {
        area: 'Profile',
        file: 'profile/inline-edit-actions.tsx',
        label: 'Save',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'Check icon or SpinnerGap · shared across editors',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Save"
            iconOnly
            icon={<Check className="size-4" />}
          />
        ),
      },
      {
        area: 'Profile',
        file: 'profile/profile-about-section.tsx',
        label: 'Edit bio',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'PencilSimple icon · shows when not editing',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Edit"
            iconOnly
            icon={<PencilSimple className="size-4" />}
          />
        ),
      },
    ],
  },
  {
    title: 'Settings',
    rows: [
      {
        area: 'Settings',
        file: 'app/(app)/settings/page.tsx',
        label: 'Update / Submit',
        variant: 'outline',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'text-muted-foreground · type=submit',
        preview: <LivePreview variant="outline" size="sm" label="Update" />,
      },
      {
        area: 'Settings',
        file: 'settings/integrations-setting.tsx',
        label: 'Disconnect',
        variant: 'ghost',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'SignOut icon · text-muted → hover:text-destructive',
        preview: (
          <LivePreview
            variant="ghost"
            size="sm"
            label="Disconnect"
            icon={<SignOut className="size-4" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Settings',
        file: 'settings/integrations-setting.tsx',
        label: 'Connect',
        variant: 'outline',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'LinkSimple icon · shown when not connected',
        preview: (
          <LivePreview
            variant="outline"
            size="sm"
            label="Connect"
            icon={<LinkSimple className="size-4" data-icon="inline-start" />}
          />
        ),
      },
    ],
  },
  {
    title: 'Notifications',
    rows: [
      {
        area: 'Notifs',
        file: 'notifications/notifications-list.tsx',
        label: 'Mark all as read',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'notifications list page (not the popover)',
        preview: <LivePreview variant="default" size="sm" label="Mark all as read" />,
      },
    ],
  },
  {
    title: 'Manage — Announcements',
    rows: [
      {
        area: 'Manage',
        file: 'manage/announcements-panel.tsx',
        label: 'Pin toggle',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'text-(--text-tertiary) · PushPin icon',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Pin"
            iconOnly
            icon={<PushPin className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/announcements-panel.tsx',
        label: 'Create Announcement',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'opens create drawer',
        preview: <LivePreview variant="default" size="sm" label="Create" />,
      },
    ],
  },
  {
    title: 'Manage — Season Dates',
    rows: [
      {
        area: 'Manage',
        file: 'manage/season-dates-section.tsx',
        label: 'Edit',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'PencilSimple icon · show when not editing',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Edit"
            iconOnly
            icon={<PencilSimple className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/season-dates-section.tsx',
        label: 'Save',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'Check icon · isPending disables',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Save"
            iconOnly
            icon={<Check className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/season-dates-section.tsx',
        label: 'Cancel',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'X icon',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Cancel"
            iconOnly
            icon={<X className="size-4" />}
          />
        ),
      },
    ],
  },
  {
    title: 'Manage — Recurring Rides',
    rows: [
      {
        area: 'Manage',
        file: 'manage/recurring-rides-panel.tsx',
        label: '+ Create',
        variant: 'outline',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'Plus icon · opens create drawer',
        preview: (
          <LivePreview
            variant="outline"
            size="sm"
            label="Create"
            icon={<Plus className="size-4" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/recurring-rides-panel.tsx',
        label: 'Generate',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'ArrowClockwise icon · generates upcoming rides',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Generate"
            iconOnly
            icon={<ArrowClockwise className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/recurring-rides-panel.tsx',
        label: 'Delete',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'Trash icon · per recurring ride',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Delete"
            iconOnly
            icon={<Trash className="size-4" />}
          />
        ),
      },
    ],
  },
  {
    title: 'Manage — Pace Tiers',
    rows: [
      {
        area: 'Manage',
        file: 'manage/pace-tiers-section.tsx',
        label: 'Save tier',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'per-tier inline editing',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Save"
            iconOnly
            icon={<Check className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/pace-tiers-section.tsx',
        label: 'Cancel tier',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'per-tier inline editing',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Cancel"
            iconOnly
            icon={<X className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/pace-tiers-section.tsx',
        label: 'N upcoming',
        sublabel: '(micro count)',
        variant: 'ghost',
        size: 'xs',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'text-(--text-tertiary) · opens upcoming rides',
        preview: <LivePreview variant="ghost" size="xs" label="3 upcoming" />,
      },
      {
        area: 'Manage',
        file: 'manage/pace-tiers-section.tsx',
        label: 'Add tier',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'Plus icon · shows add-tier form row',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Add"
            iconOnly
            icon={<Plus className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/pace-tiers-section.tsx',
        label: 'Cancel add',
        sublabel: '(icon)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'X icon · dismisses add-tier form',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Cancel"
            iconOnly
            icon={<X className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/pace-tiers-section.tsx',
        label: 'Save Tier',
        sublabel: '(drawer form submit)',
        variant: 'default',
        size: 'sm',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'type=submit in pace tier edit drawer',
        preview: <LivePreview variant="default" size="sm" label="Save Tier" />,
      },
    ],
  },
  {
    title: 'Manage — Member List',
    rows: [
      {
        area: 'Manage',
        file: 'manage/member-list.tsx',
        label: 'Make Leader / Demote',
        sublabel: '(role action)',
        variant: 'default',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'admin only · label varies by current role',
        preview: <LivePreview variant="default" size="sm" label="Make Leader" />,
      },
      {
        area: 'Manage',
        file: 'manage/member-list.tsx',
        label: 'Approve',
        variant: 'default',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'admin only · pending members tab',
        preview: <LivePreview variant="default" size="sm" label="Approve" />,
      },
    ],
  },
  {
    title: 'Manage — Invite Member',
    rows: [
      {
        area: 'Manage',
        file: 'manage/invite-member-drawer.tsx',
        label: 'Invite Member',
        sublabel: '(trigger)',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'EnvelopeSimple icon · opens drawer',
        preview: (
          <LivePreview
            variant="default"
            size="sm"
            label="Invite"
            icon={<EnvelopeSimple className="size-4" data-icon="inline-start" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/invite-member-drawer.tsx',
        label: 'Copy link',
        sublabel: '(icon)',
        variant: 'outline',
        size: 'icon-sm',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'Copy/Check icon · copies invite link',
        preview: (
          <LivePreview
            variant="outline"
            size="icon-sm"
            label="Copy"
            iconOnly
            icon={<Copy className="size-4" />}
          />
        ),
      },
      {
        area: 'Manage',
        file: 'manage/invite-member-drawer.tsx',
        label: 'Invite Another',
        variant: 'outline',
        size: 'default',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'flex-1 · resets form for another invite',
        preview: <LivePreview variant="outline" size="default" label="Invite Another" />,
      },
      {
        area: 'Manage',
        file: 'manage/invite-member-drawer.tsx',
        label: 'Done',
        variant: 'default',
        size: 'default',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'flex-1 · closes drawer',
        preview: <LivePreview variant="default" size="default" label="Done" />,
      },
      {
        area: 'Manage',
        file: 'manage/invite-member-drawer.tsx',
        label: 'Send Invite',
        variant: 'default',
        size: 'default',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'type=submit',
        preview: <LivePreview variant="default" size="default" label="Send Invite" />,
      },
      {
        area: 'Manage',
        file: 'manage/invite-member-drawer.tsx',
        label: 'Cancel',
        variant: 'outline',
        size: 'default',
        mobile: 'drawer',
        desktop: 'drawer',
        notes: 'closes drawer without sending',
        preview: <LivePreview variant="outline" size="default" label="Cancel" />,
      },
    ],
  },
  {
    title: 'Manage — Table Controls',
    rows: [
      {
        area: 'Table',
        file: 'manage/table-pagination.tsx',
        label: 'N per page',
        sublabel: '(items per page)',
        variant: 'default',
        size: 'sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'opens page-size picker',
        preview: <LivePreview variant="default" size="sm" label="20 per page" />,
      },
      {
        area: 'Table',
        file: 'manage/table-pagination.tsx',
        label: 'Page nav',
        sublabel: '(5 icon buttons)',
        variant: 'ghost',
        size: 'icon-sm',
        mobile: 'inline',
        desktop: 'inline',
        notes: 'first/prev/pages/next/last · disabled at bounds',
        preview: (
          <LivePreview
            variant="ghost"
            size="icon-sm"
            label="Next"
            iconOnly
            icon={<ArrowClockwise className="size-4" />}
          />
        ),
      },
      {
        area: 'Table',
        file: 'manage/admin-filter-toolbar.tsx',
        label: 'Filter / Sort',
        variant: 'outline',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'filter/sort dropdown trigger for admin tables',
        preview: <LivePreview variant="outline" size="sm" label="Filter" />,
      },
    ],
  },
  {
    title: 'Manage — Rides Panel',
    rows: [
      {
        area: 'Manage',
        file: 'app/(app)/manage/rides/page.tsx',
        label: 'Create Ride',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'navigates to ride creation form',
        preview: <LivePreview variant="default" size="sm" label="Create Ride" />,
      },
    ],
  },
  {
    title: 'Error Boundaries',
    rows: [
      {
        area: 'Error',
        file: 'app/(app)/error.tsx',
        label: 'Try again',
        variant: 'default',
        size: 'sm',
        mobile: 'visible',
        desktop: 'visible',
        notes: 'calls reset() from error boundary',
        preview: <LivePreview variant="default" size="sm" label="Try again" />,
      },
    ],
  },
];
