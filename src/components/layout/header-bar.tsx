"use client";

import { Users } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { AvatarMenu } from "./avatar-menu";

interface HeaderBarProps {
  appName: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarUrl: string | null;
}

/**
 * Sticky top header bar with frosted glass background.
 * Team logo left, notification bell + avatar right.
 */
export function HeaderBar({
  appName,
  userName,
  userEmail,
  userInitials,
  avatarUrl,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-xl backdrop-saturate-150 px-5 md:px-8 pt-[env(safe-area-inset-top)]">
      {/* Left: team logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-4.5 w-4.5 text-primary" />
        </div>
      </div>

      {/* Right: notification bell + avatar */}
      <div className="flex items-center gap-1.5">
        <NotificationBell />
        <AvatarMenu
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
}
