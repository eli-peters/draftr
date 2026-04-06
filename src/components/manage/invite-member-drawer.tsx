'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, EnvelopeSimple, Copy, Check } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { inviteMember } from '@/lib/auth/actions';
import { appContent } from '@/content/app';

const { manage: content, common } = appContent;
const inviteContent = content.members.invite;

interface InviteMemberDrawerProps {
  clubId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function InviteMemberDrawer({ clubId, trigger, onSuccess }: InviteMemberDrawerProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, setSentEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setError(null);
      setSuccess(false);
      setSentEmail('');
      setInviteLink(null);
      setCopied(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set('club_id', clubId);
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
      {trigger ? (
        <span
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        >
          {trigger}
        </span>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <EnvelopeSimple className="mr-1.5 h-4 w-4" />
          {content.members.inviteButton}
        </Button>
      )}

      {mounted && (
        <Drawer
          open={open}
          onOpenChange={handleOpenChange}
          direction={isMobile ? 'bottom' : 'right'}
        >
          <DrawerContent
            className={
              isMobile
                ? 'max-h-(--drawer-height-md) overflow-y-auto'
                : 'w-(--drawer-width-sidebar) overflow-y-auto'
            }
          >
            <DrawerHeader>
              <DrawerTitle>{content.members.inviteButton}</DrawerTitle>
            </DrawerHeader>

            {success ? (
              <div className="mt-8 flex flex-col items-center text-center px-4">
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
                        onClick={() => {
                          navigator.clipboard.writeText(inviteLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex gap-3 w-full">
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
                  <Button className="flex-1" onClick={() => setOpen(false)}>
                    {inviteContent.done}
                  </Button>
                </div>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-6 px-4">
                <FloatingField label={inviteContent.emailLabel} htmlFor="invite-email">
                  <Input id="invite-email" name="email" type="email" required placeholder=" " />
                </FloatingField>

                <FloatingField
                  label={inviteContent.roleLabel}
                  htmlFor="invite-role"
                  hasValue={true}
                >
                  <Select
                    name="role"
                    defaultValue="rider"
                    items={{
                      rider: content.members.roles.rider,
                      ride_leader: content.members.roles.ride_leader,
                      admin: content.members.roles.admin,
                    }}
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rider">{content.members.roles.rider}</SelectItem>
                      <SelectItem value="ride_leader">
                        {content.members.roles.ride_leader}
                      </SelectItem>
                      <SelectItem value="admin">{content.members.roles.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingField>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? common.loading : inviteContent.sendButton}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  {common.cancel}
                </Button>
              </form>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
