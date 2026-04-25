'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { appContent } from '@/content/app';
import { setupProfile } from '@/lib/auth/actions';
import { FormRootError, nativeInputPresets, useFormSubmit } from '@/lib/forms';
import { setupProfileSchema, type SetupProfileValues } from '@/lib/forms/schemas';

const { setupProfile: content } = appContent.auth;

interface ProfileSetupFormProps {
  userEmail: string;
}

export function ProfileSetupForm({ userEmail }: ProfileSetupFormProps) {
  const form = useForm<SetupProfileValues>({
    resolver: zodResolver(setupProfileSchema),
    defaultValues: { password: '', full_name: '', bio: '' },
    mode: 'onTouched',
  });

  const onSubmit = useFormSubmit({
    form,
    onSubmit: async (values) => {
      const fd = new FormData();
      fd.set('password', values.password);
      fd.set('full_name', values.full_name);
      fd.set('bio', values.bio ?? '');
      return await setupProfile(fd);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FloatingField label={appContent.auth.signIn.emailLabel} htmlFor="email" hasValue>
          <Input id="email" type="email" value={userEmail} disabled className="opacity-pending" />
        </FloatingField>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FloatingField label={content.passwordLabel}>
                <FormControl>
                  <Input {...nativeInputPresets.password.new} placeholder=" " {...field} />
                </FormControl>
              </FloatingField>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FloatingField label={content.nameLabel} helperText={content.nameHelperText}>
                <FormControl>
                  <Input {...nativeInputPresets.fullName} placeholder=" " {...field} />
                </FormControl>
              </FloatingField>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FloatingField label={content.bioLabel}>
                <FormControl>
                  <Input {...nativeInputPresets.prose} placeholder=" " {...field} />
                </FormControl>
              </FloatingField>
            </FormItem>
          )}
        />

        <FormRootError />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? appContent.common.loading : content.submitButton}
        </Button>
      </form>
    </Form>
  );
}
