import Link from "next/link";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import {
  CalendarDots,
  MapPin,
  Users,
  FlagBanner,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { appContent } from "@/content/app";

const { dashboard: content } = appContent;

interface NextSignup {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  meeting_location_name: string | null;
  pace_group_name: string | null;
  signup_count: number;
  capacity: number | null;
}

interface NextLedRide {
  id: string;
  title: string;
  ride_date: string;
  start_time: string;
  meeting_location_name: string | null;
  signup_count: number;
  capacity: number | null;
}

interface ActionBarProps {
  nextSignup: NextSignup | null;
  nextLedRide: NextLedRide | null;
}

function getRelativeDay(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE");
}

function ActionCard({
  label,
  icon: Icon,
  href,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ weight?: "duotone" | "fill"; className?: string }>;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icon weight="duotone" className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <CaretRight weight="bold" className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
        </div>
        {children}
      </div>
    </Link>
  );
}

export function ActionBar({ nextSignup, nextLedRide }: ActionBarProps) {
  const hasItems = nextSignup || nextLedRide;
  if (!hasItems) return null;

  return (
    <div className="space-y-3">
      {nextSignup && (
        <ActionCard
          label={content.actionBar.yourNextRide}
          icon={CalendarDots}
          href={`/rides/${nextSignup.id}`}
        >
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {nextSignup.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-primary">
              {getRelativeDay(parseISO(nextSignup.ride_date))} · {nextSignup.start_time.slice(0, 5)}
            </span>
            {nextSignup.meeting_location_name && (
              <span className="flex items-center gap-1">
                <MapPin weight="fill" className="h-3.5 w-3.5" />
                {nextSignup.meeting_location_name}
              </span>
            )}
          </div>
        </ActionCard>
      )}

      {nextLedRide && (
        <ActionCard
          label={content.actionBar.nextLedRide}
          icon={FlagBanner}
          href={`/rides/${nextLedRide.id}`}
        >
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {nextLedRide.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-primary">
              {getRelativeDay(parseISO(nextLedRide.ride_date))} · {nextLedRide.start_time.slice(0, 5)}
            </span>
            <span className="flex items-center gap-1">
              <Users weight="fill" className="h-3.5 w-3.5" />
              {content.actionBar.signedUp(nextLedRide.signup_count, nextLedRide.capacity)}
            </span>
          </div>
          {nextLedRide.capacity != null && (
            <div className="mt-3 h-0.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min((nextLedRide.signup_count / nextLedRide.capacity) * 100, 100)}%` }}
              />
            </div>
          )}
        </ActionCard>
      )}
    </div>
  );
}
