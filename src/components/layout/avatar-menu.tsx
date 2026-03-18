"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOut, UserCircle } from "@phosphor-icons/react";
import { signOut } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { appContent } from "@/content/app";

const { header } = appContent;

interface AvatarMenuProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarUrl: string | null;
}

/**
 * Header avatar with dropdown menu.
 * Links to profile and sign out.
 * Mobile: plain link to profile page. Desktop: dropdown menu.
 * Both variants are always rendered (CSS visibility) to avoid hydration mismatches.
 */
export function AvatarMenu({ userName, userEmail, userInitials, avatarUrl }: AvatarMenuProps) {
  const router = useRouter();

  const avatarElement = (
    <Avatar className="h-9 w-9">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
        {userInitials}
      </AvatarFallback>
    </Avatar>
  );

  const ringClassName =
    "rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <>
      {/* Mobile: navigate to profile page */}
      <Link href="/profile" className={`${ringClassName} md:hidden`}>
        {avatarElement}
      </Link>

      {/* Desktop: dropdown menu */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger className={`${ringClassName} cursor-pointer`}>
            {avatarElement}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <UserCircle weight="regular" className="mr-2 h-4 w-4" />
              {header.profile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="cursor-pointer" onClick={() => signOut()}>
              <SignOut weight="bold" className="mr-2 h-4 w-4" />
              {header.signOut}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
