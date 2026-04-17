'use client';

import { FirstAid } from '@phosphor-icons/react/dist/ssr';
import { ContentCard, ContentCardFooter } from '@/components/ui/content-card';
import { Input } from '@/components/ui/input';
import { FloatingField } from '@/components/ui/floating-field';
import { formatPhoneDisplay, formatPhoneLive, stripToDigits } from '@/lib/phone';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { appContent } from '@/content/app';

const { profile: content } = appContent;

interface ProfileEmergencyCardProps {
  initialName: string;
  initialPhone: string;
  initialRelationship: string;
}

export function ProfileEmergencyCard({
  initialName,
  initialPhone,
  initialRelationship,
}: ProfileEmergencyCardProps) {
  const { isEditing, values, setField } = useProfileForm();

  return (
    <ContentCard variant="alert" icon={FirstAid} heading={content.sections.emergencyContact}>
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <FloatingField
            label={content.emergencyContact.nameLabel}
            htmlFor="profile_emergency_name"
          >
            <Input
              id="profile_emergency_name"
              value={values.emergency_contact_name}
              onChange={(e) => setField('emergency_contact_name', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField
            label={content.emergencyContact.relationshipLabel}
            htmlFor="profile_emergency_relationship"
          >
            <Input
              id="profile_emergency_relationship"
              value={values.emergency_contact_relationship}
              onChange={(e) => setField('emergency_contact_relationship', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
          <FloatingField
            label={content.emergencyContact.phoneLabel}
            htmlFor="profile_emergency_phone"
          >
            <Input
              id="profile_emergency_phone"
              inputMode="tel"
              value={formatPhoneLive(values.emergency_contact_phone)}
              onChange={(e) =>
                setField('emergency_contact_phone', stripToDigits(e.target.value).slice(0, 10))
              }
              placeholder=" "
            />
          </FloatingField>
        </div>
      ) : initialName ? (
        <dl className="flex flex-col gap-3">
          <Row label={content.emergencyContact.nameLabel} value={initialName} />
          {initialRelationship && (
            <Row label={content.emergencyContact.relationshipLabel} value={initialRelationship} />
          )}
          {initialPhone && (
            <Row
              label={content.emergencyContact.phoneLabel}
              value={formatPhoneDisplay(initialPhone)}
            />
          )}
        </dl>
      ) : (
        <p className="text-base italic text-muted-foreground">
          {content.emergencyContact.noContact}
        </p>
      )}

      <ContentCardFooter className="border-feedback-error/15">
        <p className="text-xs leading-snug text-muted-foreground">
          {content.emergencyContact.visibilityFootnote}
        </p>
      </ContentCardFooter>
    </ContentCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 select-text truncate text-base font-semibold text-foreground">{value}</dd>
    </div>
  );
}
