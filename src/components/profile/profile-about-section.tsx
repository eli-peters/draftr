'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { PencilSimple, Check, X, SpinnerGap } from '@phosphor-icons/react';
import { User } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/lib/profile/actions';
import { appContent } from '@/content/app';

const { profile: content, common, auth } = appContent;

interface ProfileAboutSectionProps {
  bio: string;
}

export function ProfileAboutSection({ bio: initialBio }: ProfileAboutSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [isPending, startTransition] = useTransition();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEditing) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditing],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({ bio });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(content.bioSaved);
      setIsEditing(false);
    });
  }

  function handleCancel() {
    setBio(initialBio);
    setIsEditing(false);
  }

  return (
    <ContentCard className="mt-8" padding="spacious" icon={User} heading={content.sections.about}>
      {isEditing ? (
        <div className="space-y-3 rounded-xl bg-surface-sunken p-3 animate-in fade-in-0 duration-150">
          <FloatingField label={auth.setupProfile.bioLabel} htmlFor="bio" maxLength={300}>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder=" "
              maxLength={300}
            />
          </FloatingField>
          <div className="flex items-center gap-2 justify-end">
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
              onClick={handleSave}
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
        </div>
      ) : (
        <div className="group relative flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {bio ? (
              <p className="text-base text-foreground/75 leading-relaxed">{bio}</p>
            ) : (
              <p className="text-base text-muted-foreground italic">{content.noBio}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            aria-label={`${common.edit} ${content.sections.about}`}
            className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <PencilSimple className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </ContentCard>
  );
}
