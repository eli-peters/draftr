'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogClose,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { settingsContent } from '@/content/settings';
import { signOut } from '@/lib/auth/actions';

const { account: content } = settingsContent;

interface SignOutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shared confirmation dialog for the sign-out action.
 * Used by both the avatar menu and the Settings → Account card so the copy
 * and behaviour stay in lockstep across entry points.
 */
export function SignOutConfirmDialog({ open, onOpenChange }: SignOutConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.signOutConfirm}</AlertDialogTitle>
          <AlertDialogDescription>{content.rows.signOut.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose>
            <Button variant="ghost">{content.cancel}</Button>
          </AlertDialogClose>
          <form action={signOut}>
            <Button type="submit" variant="destructive">
              {content.signOutConfirmAction}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
