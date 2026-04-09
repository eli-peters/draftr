'use client';

import { PencilSimple } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProfileAvatarEditor } from '@/components/profile/profile-avatar-editor';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { getInitials } from '@/lib/utils';
import { getPaceBadgeVariant } from '@/config/formatting';
import { appContent } from '@/content/app';
import type { ProfileViewerAccess } from '@/lib/profile/access';

const { profile: content, auth } = appContent;

interface ProfileIdentityHeroProps {
  fullName: string;
  avatarUrl: string | null;
  memberSince: string;
  initialBio: string;
  initialPace: string;
  paceGroups: { id: string; name: string; sort_order: number }[];
  access: ProfileViewerAccess;
}

export function ProfileIdentityHero({
  fullName,
  avatarUrl,
  memberSince,
  initialBio,
  initialPace,
  paceGroups,
  access,
}: ProfileIdentityHeroProps) {
  const { isEditing, beginEdit, values, setField } = useProfileForm();
  const initials = getInitials(fullName);
  const showBio = isEditing || initialBio.length > 0;
  const paceSortOrder = paceGroups.find((pg) => pg.name === initialPace)?.sort_order ?? null;

  return (
    <section className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:gap-12 md:text-left">
      {/* Left — avatar */}
      <div className="shrink-0">
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

      {/* Right — name/pace/member since/bio + top-right Edit CTA */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-4 md:items-stretch">
        {/* Top row: name + Edit CTA (desktop top-right, mobile below name) */}
        <div className="flex w-full flex-col items-center gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
            {fullName}
          </h1>
          {access.canEdit && !isEditing && (
            <>
              {/* Mobile: directly below name, before pace/bio */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={beginEdit}
                className="shrink-0 self-center text-primary hover:text-primary md:hidden"
              >
                <PencilSimple weight="regular" />
                {content.editProfile}
              </Button>
              {/* Desktop: top-right, vertically centred against name */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={beginEdit}
                className="hidden shrink-0 text-primary hover:text-primary md:inline-flex"
              >
                <PencilSimple weight="regular" />
                {content.editProfile}
              </Button>
            </>
          )}
        </div>

        {/* Pace pill (own row, below name) */}
        <div className="flex w-full justify-center md:justify-start">
          <PaceTag
            isEditing={isEditing}
            value={values.preferred_pace_group}
            initialValue={initialPace}
            initialSortOrder={paceSortOrder}
            paceGroups={paceGroups}
            onChange={(v) => setField('preferred_pace_group', v)}
          />
        </div>

        {/* Member since */}
        <p className="text-base text-muted-foreground">
          {content.sections.memberSince(memberSince)}
        </p>

        {/* Bio */}
        {showBio && (
          <div className="w-full max-w-prose">
            <BioBlock
              isEditing={isEditing}
              value={values.bio}
              initialValue={initialBio}
              onChange={(v) => setField('bio', v)}
            />
          </div>
        )}
      </div>
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
    return <p className="line-clamp-3 text-base leading-relaxed text-foreground">{initialValue}</p>;
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

function PaceTag({
  isEditing,
  value,
  initialValue,
  initialSortOrder,
  paceGroups,
  onChange,
}: {
  isEditing: boolean;
  value: string;
  initialValue: string;
  initialSortOrder: number | null;
  paceGroups: { id: string; name: string; sort_order: number }[];
  onChange: (v: string) => void;
}) {
  if (isEditing) {
    return (
      <Select value={value} onValueChange={onChange} size="sm">
        <SelectTrigger className="min-w-40">
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
    );
  }

  if (!initialValue) return null;

  return (
    <Badge variant={initialSortOrder ? getPaceBadgeVariant(initialSortOrder) : 'secondary'}>
      {initialValue}
    </Badge>
  );
}
