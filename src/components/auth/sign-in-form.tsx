'use client';

import { useActionState } from 'react';
import { signIn } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { appContent } from '@/content/app';

const { signIn: content } = appContent.auth;

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await signIn(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FloatingField label={content.emailLabel} htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder=" " />
      </FloatingField>

      <FloatingField label={content.passwordLabel} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder=" "
        />
      </FloatingField>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? appContent.common.loading : content.submitButton}
      </Button>
    </form>
  );
}
