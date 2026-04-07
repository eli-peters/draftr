'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { PencilSimple, AddressBook, FirstAidKit } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { InlineEditActions } from '@/components/profile/inline-edit-actions';
import { InlineEditTransition } from '@/components/motion/inline-edit-transition';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { formatPhoneDisplay } from '@/lib/phone';
import { updateProfile } from '@/lib/profile/actions';
import { appContent } from '@/content/app';

const { profile: content, common } = appContent;

// ---------------------------------------------------------------------------
// Contact Info Editor (phone only — name and email are read-only)
// ---------------------------------------------------------------------------

function ContactInfoEditor({
  fullName,
  email,
  initialPhone,
  phoneKey,
  isPending,
  onSave,
  onCancel,
}: {
  fullName: string;
  email: string;
  initialPhone: string;
  phoneKey: number;
  isPending: boolean;
  onSave: (phone: string) => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSave() {
    const formData = new FormData(formRef.current!);
    onSave(formData.get('phone_number') as string);
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
      className="space-y-3 rounded-xl bg-surface-sunken p-3"
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
      <InlineEditActions onSave={handleSave} onCancel={onCancel} isPending={isPending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Emergency Contact Editor
// ---------------------------------------------------------------------------

function EmergencyContactEditor({
  initialName,
  initialPhone,
  initialRelationship,
  phoneKey,
  isPending,
  onSave,
  onCancel,
}: {
  initialName: string;
  initialPhone: string;
  initialRelationship: string;
  phoneKey: number;
  isPending: boolean;
  onSave: (name: string, phone: string, relationship: string) => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(initialName);
  const [relationship, setRelationship] = useState(initialRelationship);

  function handleSave() {
    const formData = new FormData(formRef.current!);
    onSave(name, formData.get('emergency_contact_phone') as string, relationship);
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <div className="flex items-center gap-2 justify-center mb-2">
        <FirstAidKit className="h-6 w-6 text-primary" />
        <p className="text-base font-bold text-foreground">{content.sections.emergencyContact}</p>
      </div>
      <FloatingField label={content.emergencyContact.nameLabel} htmlFor="emergency_contact_name">
        <Input
          id="emergency_contact_name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder=" "
        />
      </FloatingField>
      <FloatingField
        label={content.emergencyContact.relationshipLabel}
        htmlFor="emergency_contact_relationship"
      >
        <Input
          id="emergency_contact_relationship"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder={content.emergencyContact.relationshipPlaceholder}
        />
      </FloatingField>
      <FloatingField label={content.emergencyContact.phoneLabel} htmlFor="emergency_contact_phone">
        <PhoneInput
          key={`em-${phoneKey}`}
          id="emergency_contact_phone"
          name="emergency_contact_phone"
          defaultValue={initialPhone}
          placeholder=" "
        />
      </FloatingField>
      <InlineEditActions onSave={handleSave} onCancel={onCancel} isPending={isPending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Section — composes contact info + emergency contact
// ---------------------------------------------------------------------------

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
  const [isPending, startTransition] = useTransition();
  const [phoneKey, setPhoneKey] = useState(0);

  const handleCancel = useCallback(() => {
    setPhoneKey((k) => k + 1);
    setEditing(null);
  }, []);

  useEscapeKey(editing !== null, handleCancel);

  function handleSaveContact(phone: string) {
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

  function handleSaveEmergency(name: string, phone: string, relationship: string) {
    startTransition(async () => {
      const result = await updateProfile({
        emergency_contact_name: name,
        emergency_contact_phone: phone,
        emergency_contact_relationship: relationship,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(content.emergencyContact.saved);
      setEditing(null);
    });
  }

  return (
    <ContentCard
      className="mt-8"
      padding="spacious"
      icon={AddressBook}
      heading={content.sections.contactInfo}
    >
      {/* Contact Info */}
      <InlineEditTransition
        editing={editing === 'contact'}
        edit={
          <ContactInfoEditor
            fullName={fullName}
            email={email}
            initialPhone={initialPhone}
            phoneKey={phoneKey}
            isPending={isPending}
            onSave={handleSaveContact}
            onCancel={handleCancel}
          />
        }
        view={
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
                <p className="text-sm text-muted-foreground italic">
                  {content.contactInfo.noPhone}
                </p>
              )}
              <p className="text-base font-medium text-foreground">{email}</p>
            </div>
          </div>
        }
      />

      {/* Emergency Contact */}
      <div className="mt-4 rounded-2xl bg-action-primary-subtle-bg p-4">
        <InlineEditTransition
          editing={editing === 'emergency'}
          edit={
            <EmergencyContactEditor
              initialName={initialEmName}
              initialPhone={initialEmPhone}
              initialRelationship={initialEmRelationship}
              phoneKey={phoneKey}
              isPending={isPending}
              onSave={handleSaveEmergency}
              onCancel={handleCancel}
            />
          }
          view={
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
          }
        />
      </div>
    </ContentCard>
  );
}
