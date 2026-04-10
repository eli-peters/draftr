'use client';

import { useEffect, useState } from 'react';

import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';

type ResponsiveDrawerSize = 'auto' | 'md' | 'lg';

interface ResponsiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Mobile presentation height.
   * - `auto`: sizes to content (use for short confirmations)
   * - `md`: fixed 70dvh (use for short forms)
   * - `lg`: fixed 85dvh (use for tall forms / lists)
   * Default `md`.
   */
  size?: ResponsiveDrawerSize;
  /** Side the drawer slides in from on desktop (≥768px). Default `right`. */
  desktopDirection?: 'right' | 'left';
  showCloseButton?: boolean;
  className?: string;
  children: React.ReactNode;
}

const MOBILE_HEIGHT_CLASS: Record<ResponsiveDrawerSize, string> = {
  auto: '',
  md: 'h-(--drawer-height-md)',
  lg: 'h-(--drawer-height-lg)',
};

export function ResponsiveDrawer({
  open,
  onOpenChange,
  size = 'md',
  desktopDirection = 'right',
  showCloseButton,
  className,
  children,
}: ResponsiveDrawerProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const contentClassName = cn(
    isMobile ? MOBILE_HEIGHT_CLASS[size] : 'w-(--drawer-width-sidebar)',
    className,
  );

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isMobile ? 'bottom' : desktopDirection}
    >
      <DrawerContent
        className={contentClassName}
        showCloseButton={showCloseButton}
        data-drawer-size={isMobile ? size : 'desktop'}
      >
        {children}
      </DrawerContent>
    </Drawer>
  );
}
