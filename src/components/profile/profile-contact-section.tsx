'use client';

import { useState, useRef, useTransition, useCallback, useEffect } from 'react';
import {
  PencilSimple,
  Check,
  X,
  SpinnerGap,
  AddressBook,
  FirstAidKit,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { formatPhoneDisplay } from '@/lib/phone';
import { updateProfile } from '@/lib/profile/actions';
import { appContent } from '@/content/app';

const { profile: content, common } = appContent;

interface ProfileContactSectionProps {
  fullName: string;
  email: string;
  phoneNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
}

type EditingSection = null | 'contact' | 'emergency';

export function ProfileContactSection({
  fullName,
  email,
  phoneNumber: initialPhone,
  emergencyName: initialEmName,
  emergencyPhone: initialEmPhone,
  emergencyRelationship: initialEmRelationship,
}: ProfileContactSectionProps) {
  const [editing, setEditing] = useState<EditingSection>(null);
  const contactFormRef = useRef<HTMLFormElement>(null);
  const emergencyFormRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  // Emergency contact controlled fields
  const [emName, setEmName] = useState(initialEmName);
  const [emRelationship, setEmRelationship] = useState(initialEmRelationship);

  // Key to force PhoneInput remount on cancel
  const [phoneKey, setPhoneKey] = useState(0);

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!editing) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editing],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleSaveContact() {
    const formData = new FormData(contactFormRef.current!);
    const phone = formData.get('phone_number') as string;
    startTransition(async () => {
      const result = await updateProfile({ phone_number: phone });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(content.contactInfo.saved);
      setEditing(null);
    });
  }

  function handleSaveEmergency() {
    const formData = new FormData(emergencyFormRef.current!);
    const phone = formData.get('emergency_contact_phone') as string;
    startTransition(async () => {
      const result = await updateProfile({
        emergency_contact_name: emName,
        emergency_contact_phone: phone,
        emergency_contact_relationship: emRelationship,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(content.emergencyContact.saved);
      setEditing(null);
    });
  }

  function handleCancel() {
    if (editing === 'emergency') {
      setEmName(initialEmName);
      setEmRelationship(initialEmRelationship);
    }
    setPhoneKey((k) => k + 1);
    setEditing(null);
  }

  const saveButton = (onClick: () => void) => (
    <div className="flex items-center gap-2 justify-end pt-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleCancel}
        disabled={isPending}
        aria-label={common.cancel}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onClick}
        disabled={isPending}
        aria-label={common.save}
      >
        {isPending ? (
          <SpinnerGap className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <ContentCard
      className="mt-8"
      padding="spacious"
      icon={AddressBook}
      heading={content.sections.contactInfo}
    >
      {/* Contact Info Section */}
      {editing === 'contact' ? (
        <form
          ref={contactFormRef}
          onSubmit={(e) => e.preventDefault()}
          className="space-y-3 rounded-xl bg-surface-sunken p-3 animate-in fade-in-0 duration-150"
        >
          <p className="text-sm text-muted-foreground">
            {content.contactInfo.nameLabel}: {fullName}
          </p>
          <FloatingField label={content.contactInfo.phoneLabel} htmlFor="phone_number">
            <PhoneInput
              key={phoneKey}
              id="phone_number"
              name="phone_number"
              defaultValue={initialPhone}
              placeholder=" "
            />
          </FloatingField>
          <p className="text-sm text-muted-foreground">
            {content.contactInfo.emailLabel}: {email}
          </p>
          {saveButton(handleSaveContact)}
        </form>
      ) : (
        <div className="group/contact relative">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-base text-muted-foreground">{fullName}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing('contact')}
                aria-label={`${common.edit} ${content.sections.contactInfo}`}
                className="opacity-100 md:opacity-0 md:group-hover/contact:opacity-100 transition-opacity"
              >
                <PencilSimple className="h-3.5 w-3.5" />
              </Button>
            </div>
            {initialPhone ? (
              <p className="text-base font-medium text-foreground">
                {formatPhoneDisplay(initialPhone)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">{content.contactInfo.noPhone}</p>
            )}
            <p className="text-base font-medium text-foreground">{email}</p>
          </div>
        </div>
      )}

      {/* Emergency Contact Sub-Section */}
      <div className="mt-4 rounded-2xl bg-action-primary-subtle-bg p-4">
        {editing === 'emergency' ? (
          <form
            ref={emergencyFormRef}
            onSubmit={(e) => e.preventDefault()}
            className="space-y-3 animate-in fade-in-0 duration-150"
          >
            <div className="flex items-center gap-2 justify-center mb-2">
              <FirstAidKit className="h-6 w-6 text-primary" />
              <p className="text-base font-bold text-foreground">
                {content.sections.emergencyContact}
              </p>
            </div>
            <FloatingField
              label={content.emergencyContact.nameLabel}
              htmlFor="emergency_contact_name"
            >
              <Input
                id="emergency_contact_name"
                value={emName}
                onChange={(e) => setEmName(e.target.value)}
                placeholder=" "
              />
            </FloatingField>
            <FloatingField
              label={content.emergencyContact.relationshipLabel}
              htmlFor="emergency_contact_relationship"
            >
              <Input
                id="emergency_contact_relationship"
                value={emRelationship}
                onChange={(e) => setEmRelationship(e.target.value)}
                placeholder={content.emergencyContact.relationshipPlaceholder}
              />
            </FloatingField>
            <FloatingField
              label={content.emergencyContact.phoneLabel}
              htmlFor="emergency_contact_phone"
            >
              <PhoneInput
                key={`em-${phoneKey}`}
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                defaultValue={initialEmPhone}
                placeholder=" "
              />
            </FloatingField>
            {saveButton(handleSaveEmergency)}
          </form>
        ) : (
          <div className="group/emergency relative">
            <div className="flex flex-col items-center gap-2 mb-3">
              <FirstAidKit className="h-6 w-6 text-primary" />
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-foreground">
                  {content.sections.emergencyContact}
                </p>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditing('emergency')}
                  aria-label={`${common.edit} ${content.sections.emergencyContact}`}
                  className="opacity-100 md:opacity-0 md:group-hover/emergency:opacity-100 transition-opacity"
                >
                  <PencilSimple className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {initialEmName ? (
              <div className="text-center space-y-0.5">
                <p className="text-base text-foreground">
                  {initialEmName}
                  {initialEmRelationship && ` \u2014 ${initialEmRelationship}`}
                </p>
                {initialEmPhone && (
                  <p className="text-base font-bold text-foreground">
                    {formatPhoneDisplay(initialEmPhone)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-base text-muted-foreground italic text-center">
                {content.emergencyContact.noContact}
              </p>
            )}
          </div>
        )}
      </div>
    </ContentCard>
  );
}
