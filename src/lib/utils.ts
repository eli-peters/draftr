import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isToday, isTomorrow, format } from "date-fns"
import { appContent } from "@/content/app"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRelativeDay(date: Date, fallbackFormat: string = "EEEE"): string {
  if (isToday(date)) return appContent.common.today;
  if (isTomorrow(date)) return appContent.common.tomorrow;
  return format(date, fallbackFormat);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
