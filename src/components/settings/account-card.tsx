'use client';

import { useState, useTransition } from 'react';
import { EnvelopeSimple, SignOut, UserCircle } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { ContentCard } from '@/components/ui/content-card';
import { SignOutConfirmDialog } from '@/components/auth/sign-out-confirm-dialog';
import { settingsContent } from '@/content/settings';
import { sendPasswordResetEmail } from '@/lib/auth/actions';

const { account: content } = settingsContent;

interface AccountCardProps {
  email: string;
}

export function AccountCard({ email }: AccountCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSendingReset, startResetTransition] = useTransition();

  function handleChangePassword() {
    startResetTransition(async () => {
      const result = await sendPasswordResetEmail();
      if ('error' in result) {
        toast.error(content.passwordResetError);
        return;
      }
      toast.success(content.passwordResetSuccess(email));
    });
  }

  return (
    <>
      <ContentCard icon={UserCircle} heading={content.title}>
        <div className="divide-y divide-border">
          {/* Email — read-only, description explains why */}
          <div className="flex items-start justify-between gap-4 py-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {content.rows.email.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {content.rows.email.description}
              </span>
            </div>
            <span className="shrink-0 truncate text-sm text-muted-foreground">{email}</span>
          </div>

          {/* Change password — fires reset email */}
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={isSendingReset}
            className="flex w-full items-center justify-between gap-4 py-3 text-left transition-opacity disabled:opacity-60"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {content.rows.changePassword.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {content.rows.changePassword.description}
              </span>
            </div>
            {isSendingReset ? (
              <ButtonSpinner className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <EnvelopeSimple className="size-4 shrink-0 text-muted-foreground" />
            )}
          </button>

          {/* Sign out — destructive, opens shared confirm dialog */}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex w-full items-center justify-between gap-4 py-3 text-left"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-destructive">
                {content.rows.signOut.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {content.rows.signOut.description}
              </span>
            </div>
            <SignOut className="size-4 shrink-0 text-destructive" />
          </button>
        </div>
      </ContentCard>

      <SignOutConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} />
    </>
  );
}
