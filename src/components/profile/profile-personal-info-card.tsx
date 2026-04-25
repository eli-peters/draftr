'use client';

import { User } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfileForm } from '@/hooks/use-profile-form-state';
import { nativeInputPresets } from '@/lib/forms';
import { formatPhoneDisplay, formatPhoneLive, stripToDigits } from '@/lib/phone';
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
  const { isEditing, form } = useProfileForm();
  const watchedCountry = form.watch('country');

  if (isEditing) {
    const country = watchedCountry || '';
    const provinceLabel =
      country === 'US' ? content.personalInfo.stateLabel : content.personalInfo.provinceLabel;
    const postalLabel =
      country === 'US' ? content.personalInfo.zipCodeLabel : content.personalInfo.postalCodeLabel;
    const regionOptions =
      country === 'US' ? content.personalInfo.states : content.personalInfo.provinces;

    return (
      <ContentCard icon={User} heading={content.personalInfo.heading}>
        <div className="flex flex-col gap-3">
          {/* Email — read-only, managed by auth */}
          <Row label={content.contactInfo.emailLabel}>
            <span className="select-text text-base font-semibold text-foreground">{email}</span>
          </Row>

          {/* Date of birth */}
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.personalInfo.dateOfBirthLabel}>
                  <FormControl>
                    <Input type="date" placeholder=" " {...field} value={field.value ?? ''} />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.personalInfo.genderLabel} hasValue={!!field.value}>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">
                        {content.personalInfo.genderOptions.male}
                      </SelectItem>
                      <SelectItem value="female">
                        {content.personalInfo.genderOptions.female}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingField>
              </FormItem>
            )}
          />

          {/* Phone */}
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

          {/* Country — first in address section so labels adapt */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.personalInfo.countryLabel} hasValue={!!field.value}>
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => {
                      field.onChange(v);
                      // Reset region + postal when country changes
                      form.setValue('province', '', { shouldValidate: false });
                      form.setValue('postal_code', '', { shouldValidate: false });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">{content.personalInfo.countryOptions.CA}</SelectItem>
                      <SelectItem value="US">{content.personalInfo.countryOptions.US}</SelectItem>
                    </SelectContent>
                  </Select>
                </FloatingField>
              </FormItem>
            )}
          />

          {/* Street address 1 */}
          <FormField
            control={form.control}
            name="street_address_line_1"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.personalInfo.streetAddress1Label}>
                  <FormControl>
                    <Input
                      autoCapitalize="words"
                      autoComplete="address-line1"
                      placeholder=" "
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />

          {/* Street address 2 */}
          <FormField
            control={form.control}
            name="street_address_line_2"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.personalInfo.streetAddress2Label}>
                  <FormControl>
                    <Input
                      autoCapitalize="words"
                      autoComplete="address-line2"
                      placeholder=" "
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={content.personalInfo.cityLabel}>
                  <FormControl>
                    <Input
                      autoCapitalize="words"
                      autoComplete="address-level2"
                      placeholder=" "
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />

          {/* Province / State */}
          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={provinceLabel} hasValue={!!field.value}>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger>
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
              </FormItem>
            )}
          />

          {/* Postal / Zip code */}
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FloatingField label={postalLabel}>
                  <FormControl>
                    <Input
                      autoCapitalize="characters"
                      autoComplete="postal-code"
                      placeholder=" "
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                </FloatingField>
              </FormItem>
            )}
          />
        </div>
      </ContentCard>
    );
  }

  // View mode — all fields shown, "Not set" for empty ones
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
