'use client';

import { useState, useRef } from 'react';
import { CheckCircle, EnvelopeSimple, Copy, Check, UserPlus } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { CardIconHeader } from '@/components/ui/card-icon-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  DrawerBody,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { inviteMember } from '@/lib/auth/actions';
import { appContent } from '@/content/app';

const { manage: content, common } = appContent;
const inviteContent = content.members.invite;

const roleOptions = [
  { value: 'rider' as const, label: content.members.roles.rider },
  { value: 'ride_leader' as const, label: content.members.roles.ride_leader },
  { value: 'admin' as const, label: content.members.roles.admin },
];

interface InviteMemberDrawerProps {
  clubId: string;
  trigger?: React.ReactNode;
  /** Controlled open state — when provided, the component renders only the drawer (no trigger). */
  open?: boolean;
  /** Controlled open-change handler — required when `open` is provided. */
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteMemberDrawer({
  clubId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: InviteMemberDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, setSentEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<'rider' | 'ride_leader' | 'admin'>('rider');
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setSentEmail('');
      setInviteLink(null);
      setCopied(false);
      setRole('rider');
    }
    if (isControlled) {
      controlledOnOpenChange?.(isOpen);
    } else {
      setInternalOpen(isOpen);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set('club_id', clubId);
    formData.set('role', role);
    const email = formData.get('email') as string;

    const result = await inviteMember(formData);
    setIsPending(false);

    if (result.error) {
      const errorMap: Record<string, string> = {
        already_invited: inviteContent.alreadyInvited,
        rate_limited: inviteContent.rateLimited,
      };
      setError(errorMap[result.error] ?? result.error);
    } else {
      setSuccess(true);
      setSentEmail(email);
      setInviteLink(result.inviteLink ?? null);
      setCopied(false);
      formRef.current?.reset();
      onSuccess?.();
    }
  }

  return (
    <>
      {!isControlled &&
        (trigger ? (
          <span
            onClick={() => setInternalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setInternalOpen(true)}
          >
            {trigger}
          </span>
        ) : (
          <Button size="sm" onClick={() => setInternalOpen(true)}>
            <EnvelopeSimple className="mr-1.5 h-4 w-4" />
            {content.members.inviteButton}
          </Button>
        ))}

      <ResponsiveDrawer
        open={open}
        onOpenChange={handleOpenChange}
        size="auto"
        className="overflow-clip"
      >
        {success ? (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">{inviteContent.successTitle}</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              <div className="flex flex-col items-center pt-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <p className="mt-4 text-base font-semibold text-foreground">
                  {inviteContent.successTitle}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {inviteContent.successMessage}
                </p>
                {inviteLink && (
                  <div className="mt-4 w-full">
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={inviteLink}
                        className="text-xs"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(inviteLink);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch {
                            // Clipboard API unavailable — input is already selectable
                          }
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSuccess(false);
                    setSentEmail('');
                  }}
                >
                  {inviteContent.inviteAnother}
                </Button>
                <DrawerClose asChild>
                  <Button className="flex-1">{inviteContent.done}</Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </>
        ) : (
          <>
            <DrawerHeader>
              <DrawerTitle className="sr-only">{content.members.inviteButton}</DrawerTitle>
              <DrawerDescription className="sr-only">{inviteContent.emailLabel}</DrawerDescription>
              <CardIconHeader icon={UserPlus} title={content.members.inviteButton} />
            </DrawerHeader>
            <DrawerBody className="pt-2">
              <form
                ref={formRef}
                id="invite-member-form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <FloatingField label={inviteContent.emailLabel} htmlFor="invite-email">
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="send"
                    placeholder=" "
                  />
                </FloatingField>

                <SegmentedControl
                  value={role}
                  onValueChange={setRole}
                  options={roleOptions}
                  ariaLabel={inviteContent.roleLabel}
                  className="w-full"
                />

                {error && <p className="text-sm text-destructive">{error}</p>}
              </form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                type="submit"
                form="invite-member-form"
                disabled={isPending}
                size="lg"
                className="w-full"
              >
                {isPending ? common.loading : inviteContent.sendButton}
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" size="lg" className="w-full">
                  {common.cancel}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </ResponsiveDrawer>
    </>
  );
}
