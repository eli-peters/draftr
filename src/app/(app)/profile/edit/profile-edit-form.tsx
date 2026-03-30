'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useTransition } from 'react';
import { Camera } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SectionHeading } from '@/components/ui/section-heading';
import { updateProfile, uploadAvatar, removeAvatar } from '@/lib/profile/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';
import { getInitials } from '@/lib/utils';

const { auth, common, profile: profileContent } = appContent;

interface ProfileEditFormProps {
  profile: {
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
    formData.append('avatar', file);
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
      bio: formData.get('bio') as string,
      preferred_pace_group: formData.get('preferred_pace_group') as string,
      emergency_contact_name: formData.get('emergency_contact_name') as string,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string,
    });

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(routes.profile);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {/* Avatar upload */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Avatar className="h-24 w-24 ring-2 ring-primary/20 transition-opacity group-hover:opacity-80">
            {avatarPreview && <AvatarImage src={avatarPreview} alt={profile.full_name} />}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Camera badge — bottom-right offset */}
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background transition-transform group-hover:scale-110">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        {isUploading && (
          <p className="mt-2 text-sm text-muted-foreground">{profileContent.avatar.uploading}</p>
        )}
        {avatarPreview && !isUploading && (
          <button
            type="button"
            className="mt-2 text-sm text-destructive hover:underline"
            onClick={() => {
              if (!window.confirm(profileContent.avatar.removeConfirm)) return;
              startUpload(async () => {
                const result = await removeAvatar();
                if (result.error) {
                  setAvatarError(result.error);
                } else {
                  setAvatarPreview(null);
                }
              });
            }}
          >
            {profileContent.avatar.removeButton}
          </button>
        )}
        {avatarError && <p className="mt-1 text-sm text-destructive">{avatarError}</p>}
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
        <Select
          name="preferred_pace_group"
          defaultValue={profile.preferred_pace_group || undefined}
        >
          <SelectTrigger id="preferred_pace_group">
            <SelectValue placeholder={auth.setupProfile.noPreference} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{auth.setupProfile.noPreference}</SelectItem>
            {paceGroups.map((pg) => (
              <SelectItem key={pg.id} value={pg.name}>
                {pg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4 rounded-xl border border-border p-4">
        <SectionHeading as="h3">{profileContent.sections.emergencyContact}</SectionHeading>
        <p className="text-xs text-muted-foreground">
          {profileContent.emergencyContact.visibilityNote}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">
              {profileContent.emergencyContact.nameLabel}
            </Label>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={profile.emergency_contact_name}
              placeholder={profileContent.emergencyContact.namePlaceholder}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">
              {profileContent.emergencyContact.phoneLabel}
            </Label>
            <PhoneInput
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              defaultValue={profile.emergency_contact_phone}
              placeholder={profileContent.emergencyContact.phoneInputPlaceholder}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

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
