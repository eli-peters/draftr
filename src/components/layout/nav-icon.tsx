import {
  Bike,
  CalendarCheck,
  Bell,
  User,
  Settings,
} from "lucide-react";
import type { IconName } from "@/config/navigation";

const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  bike: Bike,
  "calendar-check": CalendarCheck,
  bell: Bell,
  user: User,
  settings: Settings,
};

interface NavIconProps {
  name: IconName;
  className?: string;
}

/**
 * Resolves icon name strings to Lucide icon components.
 * This indirection allows nav config to be serializable (no functions).
 */
export function NavIcon({ name, className }: NavIconProps) {
  const Icon = iconMap[name];
  return <Icon className={className} />;
}
