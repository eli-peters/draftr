'use client';

import { AddressBook } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { nativeInputPresets } from '@/lib/forms';
import { formatPhoneDisplay, formatPhoneLive, stripToDigits } from '@/lib/phone';
import { appContent } from '@/content/app';
import type { ProfileViewerAccess } from '@/lib/profile/access';

const { profile: content } = appContent;

interface ProfileContactCardProps {
  email: string;
  initialPhone: string;
  access: ProfileViewerAccess;
}

export function ProfileContactCard({ email, initialPhone, access }: ProfileContactCardProps) {
  const { isEditing, form } = useProfileForm();

  return (
    <ContentCard icon={AddressBook} heading={content.sections.contactInfo}>
      <dl className="flex flex-col gap-3">
        <Row label={content.contactInfo.phoneLabel}>
          {isEditing ? (
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FloatingField label={content.contactInfo.phoneLabel}>
                    <FormControl>
                      <Input
                        {...nativeInputPresets.phone}
                        placeholder=" "
                        value={formatPhoneLive(field.value ?? '')}
                        onChange={(e) => field.onChange(stripToDigits(e.target.value).slice(0, 10))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                  </FloatingField>
                </FormItem>
              )}
            />
          ) : initialPhone ? (
            <span className="select-text text-base font-semibold text-foreground">
              {formatPhoneDisplay(initialPhone)}
            </span>
          ) : (
            <span className="text-base italic text-muted-foreground">
              {content.contactInfo.noPhone}
            </span>
          )}
        </Row>
        {access.canSeeEmail && (
          <Row label={content.contactInfo.emailLabel}>
            <span className="select-text text-base font-semibold text-foreground">{email}</span>
          </Row>
        )}
      </dl>
    </ContentCard>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate">{children}</dd>
    </div>
  );
}
