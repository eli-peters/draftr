'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, EnvelopeSimple, Copy, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { inviteMember } from '@/lib/auth/actions';
import { appContent } from '@/content/app';

const { manage: content, common } = appContent;
const inviteContent = content.members.invite;

interface InviteMemberDrawerProps {
  clubId: string;
}

export function InviteMemberDrawer({ clubId }: InviteMemberDrawerProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
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
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <EnvelopeSimple className="mr-1.5 h-4 w-4" />
        {content.members.inviteButton}
      </Button>

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
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{inviteContent.emailLabel}</Label>
                  <Input
                    id="invite-email"
                    name="email"
                    type="email"
                    required
                    placeholder={inviteContent.emailPlaceholder}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role">{inviteContent.roleLabel}</Label>
                  <Select id="invite-role" name="role" defaultValue="rider">
                    <option value="rider">{content.members.roles.rider}</option>
                    <option value="ride_leader">{content.members.roles.ride_leader}</option>
                    <option value="admin">{content.members.roles.admin}</option>
                  </Select>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? common.loading : inviteContent.sendButton}
                </Button>
              </form>
            )}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
