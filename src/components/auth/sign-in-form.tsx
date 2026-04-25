'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { appContent } from '@/content/app';
import { signIn } from '@/lib/auth/actions';
import { FormRootError, nativeInputPresets, useFormSubmit } from '@/lib/forms';
import { signInSchema, type SignInValues } from '@/lib/forms/schemas';

const { signIn: content } = appContent.auth;

export function SignInForm() {
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = useFormSubmit({
    form,
    onSubmit: async (values) => {
      const fd = new FormData();
      fd.set('email', values.email);
      fd.set('password', values.password);
      return await signIn(fd);
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FloatingField label={content.emailLabel}>
                <FormControl>
                  <Input {...nativeInputPresets.email} placeholder=" " {...field} />
                </FormControl>
              </FloatingField>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FloatingField label={content.passwordLabel}>
                <FormControl>
                  <Input {...nativeInputPresets.password.current} placeholder=" " {...field} />
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
