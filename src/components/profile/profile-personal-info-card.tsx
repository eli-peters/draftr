'use client';

import { User } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { ContentCard } from '@/components/ui/content-card';
import { Input } from '@/components/ui/input';
import { FloatingField } from '@/components/ui/floating-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPhoneDisplay, formatPhoneLive, stripToDigits } from '@/lib/phone';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { appContent } from '@/content/app';

const { profile: content } = appContent;

interface ProfilePersonalInfoCardProps {
  email: string;
  initialPhone: string;
  initialDateOfBirth: string;
  initialGender: string;
  initialStreetAddress1: string;
  initialStreetAddress2: string;
  initialCity: string;
  initialProvince: string;
  initialPostalCode: string;
  initialCountry: string;
}

export function ProfilePersonalInfoCard({
  email,
  initialPhone,
  initialDateOfBirth,
  initialGender,
  initialStreetAddress1,
  initialStreetAddress2,
  initialCity,
  initialProvince,
  initialPostalCode,
  initialCountry,
}: ProfilePersonalInfoCardProps) {
  const { isEditing, values, setField } = useProfileForm();

  const country = isEditing ? values.country : initialCountry;
  const provinceLabel =
    country === 'US' ? content.personalInfo.stateLabel : content.personalInfo.provinceLabel;
  const postalLabel =
    country === 'US' ? content.personalInfo.zipCodeLabel : content.personalInfo.postalCodeLabel;
  const regionOptions =
    country === 'US' ? content.personalInfo.states : content.personalInfo.provinces;

  if (isEditing) {
    return (
      <ContentCard icon={User} heading={content.personalInfo.heading}>
        <div className="flex flex-col gap-3">
          {/* Email — read-only, managed by auth */}
          <Row label={content.contactInfo.emailLabel}>
            <span className="select-text text-base font-semibold text-foreground">{email}</span>
          </Row>

          {/* Date of birth */}
          <FloatingField label={content.personalInfo.dateOfBirthLabel} htmlFor="profile_dob">
            <Input
              id="profile_dob"
              type="date"
              value={values.date_of_birth}
              onChange={(e) => setField('date_of_birth', e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          {/* Gender */}
          <FloatingField
            label={content.personalInfo.genderLabel}
            htmlFor="profile_gender"
            hasValue={!!values.gender}
          >
            <Select value={values.gender} onValueChange={(v) => setField('gender', v)}>
              <SelectTrigger id="profile_gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{content.personalInfo.genderOptions.male}</SelectItem>
                <SelectItem value="female">{content.personalInfo.genderOptions.female}</SelectItem>
              </SelectContent>
            </Select>
          </FloatingField>

          {/* Phone */}
          <FloatingField label={content.contactInfo.phoneLabel} htmlFor="profile_phone">
            <Input
              id="profile_phone"
              inputMode="tel"
              value={formatPhoneLive(values.phone_number)}
              onChange={(e) => setField('phone_number', stripToDigits(e.target.value).slice(0, 10))}
              placeholder=" "
            />
          </FloatingField>

          {/* Country — first in address section so labels adapt */}
          <FloatingField
            label={content.personalInfo.countryLabel}
            htmlFor="profile_country"
            hasValue={!!values.country}
          >
            <Select
              value={values.country}
              onValueChange={(v) => {
                setField('country', v);
                // Reset province and postal when country changes
                setField('province', '');
                setField('postal_code', '');
              }}
            >
              <SelectTrigger id="profile_country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CA">{content.personalInfo.countryOptions.CA}</SelectItem>
                <SelectItem value="US">{content.personalInfo.countryOptions.US}</SelectItem>
              </SelectContent>
            </Select>
          </FloatingField>

          {/* Street address 1 */}
          <FloatingField label={content.personalInfo.streetAddress1Label} htmlFor="profile_street1">
            <Input
              id="profile_street1"
              value={values.street_address_line_1}
              onChange={(e) => setField('street_address_line_1', e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          {/* Street address 2 */}
          <FloatingField label={content.personalInfo.streetAddress2Label} htmlFor="profile_street2">
            <Input
              id="profile_street2"
              value={values.street_address_line_2}
              onChange={(e) => setField('street_address_line_2', e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          {/* City */}
          <FloatingField label={content.personalInfo.cityLabel} htmlFor="profile_city">
            <Input
              id="profile_city"
              value={values.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder=" "
            />
          </FloatingField>

          {/* Province / State */}
          <FloatingField
            label={provinceLabel}
            htmlFor="profile_province"
            hasValue={!!values.province}
          >
            <Select value={values.province} onValueChange={(v) => setField('province', v)}>
              <SelectTrigger id="profile_province">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(regionOptions).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FloatingField>

          {/* Postal / Zip code */}
          <FloatingField label={postalLabel} htmlFor="profile_postal">
            <Input
              id="profile_postal"
              value={values.postal_code}
              onChange={(e) => setField('postal_code', e.target.value)}
              placeholder=" "
            />
          </FloatingField>
        </div>
      </ContentCard>
    );
  }

  // View mode — always show all fields, "Not set" placeholder for empty ones
  const notSet = (
    <span className="text-base italic text-muted-foreground">{content.personalInfo.notSet}</span>
  );

  const hasAddress = initialStreetAddress1 || initialCity || initialProvince || initialPostalCode;

  return (
    <ContentCard icon={User} heading={content.personalInfo.heading}>
      <dl className="flex flex-col gap-3">
        <Row label={content.contactInfo.emailLabel}>
          <span className="select-text">{email}</span>
        </Row>
        <Row label={content.contactInfo.phoneLabel}>
          {initialPhone ? formatPhoneDisplay(initialPhone) : notSet}
        </Row>
        <Row label={content.personalInfo.dateOfBirthLabel}>{initialDateOfBirth || notSet}</Row>
        <Row label={content.personalInfo.genderLabel}>
          {initialGender
            ? (content.personalInfo.genderOptions[initialGender as 'male' | 'female'] ??
              initialGender)
            : notSet}
        </Row>
        <Row label={content.personalInfo.streetAddress1Label}>
          {hasAddress ? (
            <div className="flex flex-col gap-0.5">
              {initialStreetAddress1 && <span>{initialStreetAddress1}</span>}
              {initialStreetAddress2 && <span>{initialStreetAddress2}</span>}
              {(initialCity || initialProvince || initialPostalCode) && (
                <span>
                  {[initialCity, initialProvince].filter(Boolean).join(', ')}
                  {initialPostalCode ? ` ${initialPostalCode}` : ''}
                </span>
              )}
              {initialCountry && (
                <span>
                  {content.personalInfo.countryOptions[initialCountry as 'CA' | 'US'] ??
                    initialCountry}
                </span>
              )}
            </div>
          ) : (
            notSet
          )}
        </Row>
      </dl>
    </ContentCard>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 select-text text-base font-semibold text-foreground">{children}</dd>
    </div>
  );
}
