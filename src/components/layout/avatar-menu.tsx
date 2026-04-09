'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircle, GearSix, SignOut } from '@phosphor-icons/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { SignOutConfirmDialog } from '@/components/auth/sign-out-confirm-dialog';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const { avatarMenu: content, profile: profileContent } = appContent;

interface AvatarMenuProps {
  userName: string;
  userInitials: string;
  avatarUrl: string | null;
  userRole: string;
}

/**
 * Header avatar menu.
 * Desktop: dropdown menu. Mobile: bottom sheet drawer.
 * Shows My Profile, Settings, and Sign Out.
 */
export function AvatarMenu({ userName, userInitials, avatarUrl, userRole }: AvatarMenuProps) {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const roleLabel = profileContent.roles[userRole as keyof typeof profileContent.roles] ?? userRole;

  const avatarElement = (
    <Avatar className="h-9 w-9 after:border-border-strong">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
      <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
        {userInitials}
      </AvatarFallback>
    </Avatar>
  );

  const headerBlock = (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-left">
        <p className="text-sm font-medium text-foreground truncate">{userName}</p>
        <p className="text-xs text-muted-foreground">{roleLabel}</p>
      </div>
    </div>
  );

  function handleNavigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  function handleSignOut() {
    setOpen(false);
    setConfirmOpen(true);
  }

  const signOutConfirmDialog = (
    <SignOutConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
  );

  // Mobile: bottom sheet drawer
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center rounded-full p-0.5 ring-offset-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={appContent.header.profileMenu}
            >
              {avatarElement}
            </button>
          </DrawerTrigger>
          <DrawerContent showCloseButton={false}>
            <DrawerHeader>
              <DrawerTitle className="sr-only">{appContent.header.profileMenu}</DrawerTitle>
              <DrawerDescription className="sr-only">
                {appContent.header.profileMenu}
              </DrawerDescription>
              {headerBlock}
            </DrawerHeader>
            <DrawerBody className="flex flex-col gap-1 pb-5">
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start gap-3"
                  onClick={() => handleNavigate(routes.profile)}
                >
                  <UserCircle className="size-5 text-muted-foreground" />
                  {content.myProfile}
                </Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start gap-3"
                  onClick={() => handleNavigate(routes.settings)}
                >
                  <GearSix className="size-5 text-muted-foreground" />
                  {content.settings}
                </Button>
              </DrawerClose>
              <div className="my-1 h-px bg-border" />
              <DrawerClose asChild>
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full justify-start gap-3"
                  onClick={handleSignOut}
                >
                  <SignOut className="size-5" />
                  {content.signOut}
                </Button>
              </DrawerClose>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
        {signOutConfirmDialog}
      </>
    );
  }

  // Desktop: dropdown menu
  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className="flex items-center justify-center rounded-full p-0.5 ring-offset-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          render={<button type="button" aria-label={appContent.header.profileMenu} />}
        >
          {avatarElement}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" sideOffset={8} className="w-56">
          <div className="px-3 py-2.5">{headerBlock}</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleNavigate(routes.profile)}>
            <UserCircle className="size-4" />
            {content.myProfile}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleNavigate(routes.settings)}>
            <GearSix className="size-4" />
            {content.settings}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <SignOut className="size-4" />
            {content.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {signOutConfirmDialog}
    </>
  );
}
