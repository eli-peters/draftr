'use client';

import { useState } from 'react';
import { Check } from '@phosphor-icons/react/dist/ssr';
import { FloatingField } from '@/components/ui/floating-field';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ContentCard } from '@/components/ui/content-card';
import { updateProfile } from '@/lib/profile/actions';
import { appContent } from '@/content/app';

const { auth, common, profile: content } = appContent;

interface ProfileDetailsFormProps {
  bio: string;
  preferredPaceGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  paceGroups: { id: string; name: string }[];
}

export function ProfileDetailsForm({
  bio,
  preferredPaceGroup,
  emergencyContactName,
  emergencyContactPhone,
  paceGroups,
}: ProfileDetailsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSaved(false);

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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* About */}
      <ContentCard padding="compact" heading={content.sections.about}>
        <FloatingField label={auth.setupProfile.bioLabel} htmlFor="bio" maxLength={300}>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={bio}
            rows={3}
            placeholder=" "
            maxLength={300}
          />
        </FloatingField>
      </ContentCard>

      {/* Preferences */}
      <ContentCard padding="compact" heading={content.sections.preferences}>
        <FloatingField
          label={auth.setupProfile.paceLabel}
          htmlFor="preferred_pace_group"
          hasValue={!!preferredPaceGroup}
        >
          <Select name="preferred_pace_group" defaultValue={preferredPaceGroup || undefined}>
            <SelectTrigger id="preferred_pace_group">
              <SelectValue />
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
        </FloatingField>
      </ContentCard>

      {/* Emergency Contact */}
      <ContentCard
        className="space-y-4"
        padding="compact"
        heading={content.sections.emergencyContact}
      >
        <p className="text-xs text-muted-foreground">{content.emergencyContact.visibilityNote}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatingField
            label={content.emergencyContact.nameLabel}
            htmlFor="emergency_contact_name"
          >
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={emergencyContactName}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField
            label={content.emergencyContact.phoneLabel}
            htmlFor="emergency_contact_phone"
          >
            <PhoneInput
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              defaultValue={emergencyContactPhone}
              placeholder=" "
            />
          </FloatingField>
        </div>
      </ContentCard>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? common.loading : common.save}
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success">
            <Check className="h-4 w-4" weight="bold" />
            {common.saved}
          </span>
        )}
      </div>
    </form>
  );
}
