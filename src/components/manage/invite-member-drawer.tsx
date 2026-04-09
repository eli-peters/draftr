'use client';

import { useState, useRef } from 'react';
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
import { DrawerBody, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
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

      <ResponsiveDrawer open={open} onOpenChange={handleOpenChange} size="auto">
        <DrawerHeader>
          <DrawerTitle>{content.members.inviteButton}</DrawerTitle>
        </DrawerHeader>

        {success ? (
          <>
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
                <Button className="flex-1" onClick={() => setOpen(false)}>
                  {inviteContent.done}
                </Button>
              </div>
            </DrawerFooter>
          </>
        ) : (
          <>
            <DrawerBody className="space-y-6 pt-2">
              <form
                ref={formRef}
                id="invite-member-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
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
              </form>
            </DrawerBody>
            <DrawerFooter>
              <Button
                type="submit"
                form="invite-member-form"
                disabled={isPending}
                className="w-full"
              >
                {isPending ? common.loading : inviteContent.sendButton}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                {common.cancel}
              </Button>
            </DrawerFooter>
          </>
        )}
      </ResponsiveDrawer>
    </>
  );
}
