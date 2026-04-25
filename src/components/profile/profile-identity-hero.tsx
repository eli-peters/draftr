'use client';

import { PencilSimple } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProfileAvatarEditor } from '@/components/profile/profile-avatar-editor';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { nativeInputPresets } from '@/lib/forms';
import { getInitials } from '@/lib/utils';
import { appContent } from '@/content/app';
import type { ProfileViewerAccess } from '@/lib/profile/access';

const { profile: content, auth } = appContent;

const BIO_MAX = 300;

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
  const { isEditing, beginEdit, form } = useProfileForm();
  const initials = getInitials(fullName);
  const showBio = isEditing || initialBio.length > 0;

  return (
    <section className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-4 md:gap-x-6 lg:gap-x-12">
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

      <div className="flex min-w-0 flex-col items-start gap-1">
        <div className="flex w-full flex-row items-start justify-between gap-3 lg:gap-6">
          {isEditing ? (
            <div className="flex w-full gap-3 md:max-w-md">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FloatingField label={content.personalInfo.firstNameLabel}>
                      <FormControl>
                        <Input {...nativeInputPresets.firstName} placeholder=" " {...field} />
                      </FormControl>
                    </FloatingField>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FloatingField label={content.personalInfo.lastNameLabel}>
                      <FormControl>
                        <Input {...nativeInputPresets.lastName} placeholder=" " {...field} />
                      </FormControl>
                    </FloatingField>
                  </FormItem>
                )}
              />
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

        <p className="text-base text-muted-foreground">
          {content.sections.memberSince(memberSince)}
        </p>
      </div>

      {showBio && (
        <div className="col-span-2 w-full max-w-prose lg:col-span-1 lg:col-start-2">
          {isEditing ? (
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FloatingField label={auth.setupProfile.bioLabel} maxLength={BIO_MAX}>
                    <FormControl>
                      <Textarea
                        {...nativeInputPresets.composer}
                        rows={3}
                        placeholder=" "
                        maxLength={BIO_MAX}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                  </FloatingField>
                </FormItem>
              )}
            />
          ) : (
            <p className="line-clamp-3 select-text text-base leading-relaxed text-foreground">
              {initialBio}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
