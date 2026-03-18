"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useTransition } from "react";
import { Camera } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateProfile, uploadAvatar } from "@/lib/profile/actions";
import { appContent } from "@/content/app";
import { getInitials } from "@/lib/utils";

const { auth, common, profile: profileContent } = appContent;

interface ProfileEditFormProps {
  profile: {
    display_name: string;
    bio: string;
    preferred_pace_group: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    avatar_url: string | null;
    full_name: string;
  };
  paceGroups: { id: string; name: string }[];
}

export function ProfileEditForm({ profile, paceGroups }: ProfileEditFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(profile.full_name);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarError(null);

    // Upload
    const formData = new FormData();
    formData.append("avatar", file);
    startUpload(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) {
        setAvatarError(result.error);
        setAvatarPreview(profile.avatar_url);
      } else if (result.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
      }
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile({
      display_name: formData.get("display_name") as string,
      bio: formData.get("bio") as string,
      preferred_pace_group: formData.get("preferred_pace_group") as string,
      emergency_contact_name: formData.get("emergency_contact_name") as string,
      emergency_contact_phone: formData.get("emergency_contact_phone") as string,
    });

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/profile");
    }
  }

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* Avatar upload */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="relative group"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Avatar className="h-24 w-24 ring-2 ring-primary/20">
            {avatarPreview && <AvatarImage src={avatarPreview} alt={profile.full_name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera weight="fill" className="h-6 w-6 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 text-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? profileContent.avatar.uploading : profileContent.avatar.uploadButton}
        </Button>
        {avatarError && (
          <p className="mt-1 text-sm text-destructive">{avatarError}</p>
        )}
      </div>

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
          className={selectClass}
        >
          <option value="">{auth.setupProfile.noPreference}</option>
          {paceGroups.map((pg) => (
            <option key={pg.id} value={pg.name}>{pg.name}</option>
          ))}
        </select>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {profileContent.sections.emergencyContact}
        </h3>
        <p className="text-xs text-muted-foreground">{profileContent.emergencyContact.visibilityNote}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">{profileContent.emergencyContact.nameLabel}</Label>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={profile.emergency_contact_name}
              placeholder={profileContent.emergencyContact.namePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">{profileContent.emergencyContact.phoneLabel}</Label>
            <Input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              type="tel"
              defaultValue={profile.emergency_contact_phone}
              placeholder={profileContent.emergencyContact.phonePlaceholder}
            />
          </div>
        </div>
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
