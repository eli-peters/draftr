"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { inviteMember } from "@/lib/auth/actions";
import { appContent } from "@/content/app";

const { manage: content, common } = appContent;

interface InviteMemberDialogProps {
  clubId: string;
}

export function InviteMemberDialog({ clubId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set("club_id", clubId);

    const result = await inviteMember(formData);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Reset form after short delay then close
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <EnvelopeSimple weight="bold" className="mr-1.5 h-4 w-4" />
        {content.members.invite}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{content.members.invite}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 px-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="rider@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              defaultValue="rider"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="rider">{content.members.roles.rider}</option>
              <option value="ride_leader">{content.members.roles.ride_leader}</option>
              <option value="admin">{content.members.roles.admin}</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Invite sent!</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? common.loading : "Send Invite"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
