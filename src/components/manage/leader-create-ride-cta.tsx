'use client';

import Link from 'next/link';
import { Plus } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui/button';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const content = appContent.manage.leaderHub;

export function LeaderCreateRideCta() {
  return (
    <Link href={routes.manageNewRide} className={buttonVariants({ size: 'sm' })}>
      <Plus weight="bold" className="size-4" />
      {content.createRide}
    </Link>
  );
}
