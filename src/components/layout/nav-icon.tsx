import {
  House,
  Bicycle,
  CalendarCheck,
  Bell,
  UserCircle,
  GearSix,
} from '@phosphor-icons/react/dist/ssr';
import type { IconName } from '@/config/navigation';

const iconMap: Record<
  IconName,
  React.ComponentType<{
    className?: string;
    weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  }>
> = {
  house: House,
  bike: Bicycle,
  'calendar-check': CalendarCheck,
  bell: Bell,
  user: UserCircle,
  settings: GearSix,
};

interface NavIconProps {
  name: IconName;
  className?: string;
  active?: boolean;
}

/**
 * Resolves icon name strings to Phosphor icon components.
 * Uses fill weight when active, regular when inactive.
 */
export function NavIcon({ name, className, active }: NavIconProps) {
  const Icon = iconMap[name];
  return <Icon className={className} weight={active ? 'fill' : 'regular'} />;
}
