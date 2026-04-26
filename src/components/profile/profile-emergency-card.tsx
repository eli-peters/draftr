'use client';

import { FirstAid } from '@phosphor-icons/react/dist/ssr';
import { ContentCard, ContentCardFooter } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { nativeInputPresets } from '@/lib/forms';
import { inputLimits } from '@/lib/forms/limits';
import { formatPhoneDisplay, formatPhoneLive, stripToDigits } from '@/lib/phone';
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
  const { isEditing, form } = useProfileForm();

  return (
    <ContentCard variant="alert" icon={FirstAid} heading={content.sections.emergencyContact}>
      {isEditing ? (
        <div className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FloatingField
                  label={content.emergencyContact.nameLabel}
                  maxLength={inputLimits.profile.emergencyContactName}
                >
                  <FormControl>
                    <Input
                      {...nativeInputPresets.fullName}
                      placeholder=" "
                      maxLength={inputLimits.profile.emergencyContactName}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FloatingField
                  label={content.emergencyContact.relationshipLabel}
                  maxLength={inputLimits.profile.emergencyContactRelationship}
                >
                  <FormControl>
                    <Input
                      autoCapitalize="words"
                      autoCorrect="off"
                      placeholder=" "
                      maxLength={inputLimits.profile.emergencyContactRelationship}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergency_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.emergencyContact.phoneLabel}>
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

      <ContentCardFooter>
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
