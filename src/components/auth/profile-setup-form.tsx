'use client';

import { useActionState } from 'react';
import { setupProfile } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { appContent } from '@/content/app';

const { setupProfile: content } = appContent.auth;

interface ProfileSetupFormProps {
  userEmail: string;
}

export function ProfileSetupForm({ userEmail }: ProfileSetupFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await setupProfile(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FloatingField label={appContent.auth.signIn.emailLabel} htmlFor="email" hasValue={true}>
        <Input id="email" type="email" value={userEmail} disabled className="opacity-pending" />
      </FloatingField>

      <FloatingField label={content.passwordLabel} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder=" "
          autoComplete="new-password"
        />
      </FloatingField>

      <FloatingField
        label={content.nameLabel}
        htmlFor="full_name"
        helperText={content.nameHelperText}
      >
        <Input
          id="full_name"
          name="full_name"
          type="text"
          required
          pattern=".*\S+\s+\S+.*"
          title={content.nameValidationError}
          autoComplete="name"
          placeholder=" "
        />
      </FloatingField>

      <FloatingField label={content.bioLabel} htmlFor="bio">
        <Input id="bio" name="bio" type="text" placeholder=" " />
      </FloatingField>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? appContent.common.loading : content.submitButton}
      </Button>
    </form>
  );
}
