"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/profile/actions";
import { appContent } from "@/content/app";

const { auth, common } = appContent;

interface ProfileEditFormProps {
  profile: {
    display_name: string;
    bio: string;
    preferred_pace_group: string;
  };
  paceGroups: { id: string; name: string }[];
}

export function ProfileEditForm({ profile, paceGroups }: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile({
      display_name: formData.get("display_name") as string,
      bio: formData.get("bio") as string,
      preferred_pace_group: formData.get("preferred_pace_group") as string,
    });

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/profile");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">{auth.setupProfile.displayNameLabel}</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name}
          placeholder={auth.setupProfile.displayNamePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{auth.setupProfile.bioLabel}</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio}
          rows={3}
          placeholder={auth.setupProfile.bioPlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred_pace_group">{auth.setupProfile.paceLabel}</Label>
        <select
          id="preferred_pace_group"
          name="preferred_pace_group"
          defaultValue={profile.preferred_pace_group}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">{auth.setupProfile.noPreference}</option>
          {paceGroups.map((pg) => (
            <option key={pg.id} value={pg.name}>{pg.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? common.loading : common.save}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {common.cancel}
        </Button>
      </div>
    </form>
  );
}
