'use client';

import { PencilSimple } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProfileAvatarEditor } from '@/components/profile/profile-avatar-editor';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { getInitials } from '@/lib/utils';
import { appContent } from '@/content/app';
import type { ProfileViewerAccess } from '@/lib/profile/access';

const { profile: content, auth } = appContent;

interface ProfileIdentityHeroProps {
  fullName: string;
  avatarUrl: string | null;
  memberSince: string;
  initialBio: string;
  access: ProfileViewerAccess;
}

export function ProfileIdentityHero({
  fullName,
  avatarUrl,
  memberSince,
  initialBio,
  access,
}: ProfileIdentityHeroProps) {
  const { isEditing, beginEdit, values, setField } = useProfileForm();
  const initials = getInitials(fullName);
  const showBio = isEditing || initialBio.length > 0;

  return (
    <section className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-4 md:gap-x-6 lg:gap-x-12">
      {/* Column 1 — avatar */}
      <div className="flex shrink-0 flex-col items-start gap-3">
        {access.canEdit ? (
          <ProfileAvatarEditor avatarUrl={avatarUrl} fullName={fullName} initials={initials} />
        ) : (
          <Avatar className="h-24 w-24 ring-2 ring-primary/20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Column 2 — name, member since, Edit CTA (and bio on desktop) */}
      <div className="flex min-w-0 flex-col items-start gap-1">
        {/* Top row: name + Edit CTA (icon-only on mobile, labeled on desktop) */}
        <div className="flex w-full flex-row items-start justify-between gap-3 lg:gap-6">
          {isEditing ? (
            <div className="flex w-full gap-3 md:max-w-md">
              <FloatingField
                label={content.personalInfo.firstNameLabel}
                htmlFor="profile_first_name"
              >
                <Input
                  id="profile_first_name"
                  value={values.first_name}
                  onChange={(e) => setField('first_name', e.target.value)}
                  placeholder=" "
                />
              </FloatingField>
              <FloatingField label={content.personalInfo.lastNameLabel} htmlFor="profile_last_name">
                <Input
                  id="profile_last_name"
                  value={values.last_name}
                  onChange={(e) => setField('last_name', e.target.value)}
                  placeholder=" "
                />
              </FloatingField>
            </div>
          ) : (
            <h1 className="line-clamp-2 min-w-0 font-display text-3xl leading-10 font-extrabold tracking-tight wrap-break-word hyphens-auto text-foreground lg:text-5xl lg:leading-13">
              {fullName}
            </h1>
          )}
          {access.canEdit && !isEditing && (
            <div className="flex h-10 shrink-0 items-center lg:h-13">
              <Button
                type="button"
                variant="ghost"
                size="default"
                onClick={beginEdit}
                aria-label={content.editProfile}
              >
                <PencilSimple weight="regular" />
                <span className="hidden lg:inline">{content.editProfile}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Member since */}
        <p className="text-base text-muted-foreground">
          {content.sections.memberSince(memberSince)}
        </p>
      </div>

      {/* Bio — spans full width on mobile, sits in column 2 on desktop */}
      {showBio && (
        <div className="col-span-2 w-full max-w-prose lg:col-span-1 lg:col-start-2">
          <BioBlock
            isEditing={isEditing}
            value={values.bio}
            initialValue={initialBio}
            onChange={(v) => setField('bio', v)}
          />
        </div>
      )}
    </section>
  );
}

function BioBlock({
  isEditing,
  value,
  initialValue,
  onChange,
}: {
  isEditing: boolean;
  value: string;
  initialValue: string;
  onChange: (v: string) => void;
}) {
  if (!isEditing) {
    return (
      <p className="line-clamp-3 select-text text-base leading-relaxed text-foreground">
        {initialValue}
      </p>
    );
  }
  return (
    <FloatingField label={auth.setupProfile.bioLabel} htmlFor="profile_bio" maxLength={300}>
      <Textarea
        id="profile_bio"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder=" "
        maxLength={300}
      />
    </FloatingField>
  );
}
