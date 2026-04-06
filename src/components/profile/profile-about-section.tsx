'use client';

import { useCallback, useState, useTransition } from 'react';
import { PencilSimple } from '@phosphor-icons/react';
import { User } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { InlineEditActions } from '@/components/profile/inline-edit-actions';
import { useEscapeKey } from '@/hooks/use-escape-key';
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

  const handleCancel = useCallback(() => {
    setBio(initialBio);
    setIsEditing(false);
  }, [initialBio]);

  useEscapeKey(isEditing, handleCancel);

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
          <InlineEditActions onSave={handleSave} onCancel={handleCancel} isPending={isPending} />
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
