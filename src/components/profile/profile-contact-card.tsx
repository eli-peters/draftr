'use client';

import { AddressBook } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { ContentCard } from '@/components/ui/content-card';
import { Input } from '@/components/ui/input';
import { FloatingField } from '@/components/ui/floating-field';
import { formatPhoneDisplay, formatPhoneLive, stripToDigits } from '@/lib/phone';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { appContent } from '@/content/app';
import type { ProfileViewerAccess } from '@/lib/profile/access';

const { profile: content } = appContent;

interface ProfileContactCardProps {
  email: string;
  initialPhone: string;
  access: ProfileViewerAccess;
}

export function ProfileContactCard({ email, initialPhone, access }: ProfileContactCardProps) {
  const { isEditing, values, setField } = useProfileForm();

  return (
    <ContentCard icon={AddressBook} heading={content.sections.contactInfo} padding="spacious">
      <dl className="flex flex-col gap-3">
        <Row label={content.contactInfo.phoneLabel}>
          {isEditing ? (
            <FloatingField label={content.contactInfo.phoneLabel} htmlFor="profile_phone">
              <Input
                id="profile_phone"
                inputMode="tel"
                value={formatPhoneLive(values.phone_number)}
                onChange={(e) =>
                  setField('phone_number', stripToDigits(e.target.value).slice(0, 10))
                }
                placeholder=" "
              />
            </FloatingField>
          ) : initialPhone ? (
            <span className="text-base font-semibold text-foreground">
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
            <span className="text-base font-semibold text-foreground">{email}</span>
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
