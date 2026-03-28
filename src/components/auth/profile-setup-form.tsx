'use client';

import { useActionState } from 'react';
import { setupProfile } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{appContent.auth.signIn.emailLabel}</Label>
        <Input id="email" type="email" value={userEmail} disabled className="opacity-pending" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{content.passwordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder={content.passwordPlaceholder}
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">{content.nameLabel}</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          required
          pattern=".*\S+\s+\S+.*"
          title={content.nameValidationError}
          autoComplete="name"
        />
        <p className="text-xs text-muted-foreground">{content.nameHelperText}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">{content.bioLabel}</Label>
        <Input id="bio" name="bio" type="text" placeholder="Optional" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? appContent.common.loading : content.submitButton}
      </Button>
    </form>
  );
}
