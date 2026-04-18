import { BicycleIcon, CalendarCheckIcon } from '@phosphor-icons/react/dist/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';

const { profile: content } = appContent;

interface ProfileStatsBentoProps {
  totalRides: number;
  ridesThisMonth: number;
}

interface StatProps {
  icon: PhosphorIcon;
  label: string;
  value: number;
}

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="flex flex-1 flex-col gap-1 p-4">
      <span className="text-overline font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Icon className="size-5 shrink-0 text-muted-foreground" weight="regular" />
        <span className="font-display text-2xl font-bold tabular-nums leading-none text-foreground">
          {value}
        </span>
      </div>
    </div>
  );
}

/**
 * ProfileStatsBento — dense horizontal stat strip for the profile page.
 *
 * Two stats sit inside a single card, separated by a vertical divider, with
 * left-aligned icons and overline labels. Replaces the prior 2-tile bento
 * (giant centered numbers) per Finding 6.3 — earns its space by being dense
 * and immediate, not by being large.
 */
export function ProfileStatsBento({ totalRides, ridesThisMonth }: ProfileStatsBentoProps) {
  return (
    <ContentCard variant="elevated" padding="none">
      <div className="flex items-stretch divide-x divide-(--border-subtle)">
        <Stat icon={BicycleIcon} label={content.statsBento.totalRides} value={totalRides} />
        <Stat
          icon={CalendarCheckIcon}
          label={content.statsBento.thisMonth}
          value={ridesThisMonth}
        />
      </div>
    </ContentCard>
  );
}
