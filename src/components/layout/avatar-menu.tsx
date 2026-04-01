import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const { header } = appContent;

interface AvatarMenuProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarUrl: string | null;
}

/**
 * Header avatar that links directly to the profile page.
 */
export function AvatarMenu({ userName, userInitials, avatarUrl }: AvatarMenuProps) {
  const avatarElement = (
    <Avatar className="h-9 w-9 after:border-border-strong">
      {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
      <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs font-bold">
        {userInitials}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <Link
      href={routes.profile}
      className="rounded-full ring-offset-primary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={header.profileMenu}
    >
      {avatarElement}
    </Link>
  );
}
