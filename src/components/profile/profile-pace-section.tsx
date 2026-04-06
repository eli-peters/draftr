'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { PencilSimple, Check, X, SpinnerGap, Bicycle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { updateProfile } from '@/lib/profile/actions';
import { appContent } from '@/content/app';

const { profile: content, common, auth } = appContent;

interface ProfilePaceSectionProps {
  preferredPaceGroup: string;
  paceGroups: { id: string; name: string }[];
}

export function ProfilePaceSection({
  preferredPaceGroup: initialPace,
  paceGroups,
}: ProfilePaceSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [pace, setPace] = useState(initialPace);
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
      const result = await updateProfile({ preferred_pace_group: pace });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(content.paceSaved);
      setIsEditing(false);
    });
  }

  function handleCancel() {
    setPace(initialPace);
    setIsEditing(false);
  }

  return (
    <ContentCard className="mt-8" padding="spacious">
      {isEditing ? (
        <div className="space-y-3 rounded-xl bg-surface-sunken p-3 animate-in fade-in-0 duration-150">
          <FloatingField
            label={auth.setupProfile.paceLabel}
            htmlFor="preferred_pace_group"
            hasValue={!!pace}
          >
            <Select value={pace} onValueChange={setPace}>
              <SelectTrigger id="preferred_pace_group">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{auth.setupProfile.noPreference}</SelectItem>
                {paceGroups.map((pg) => (
                  <SelectItem key={pg.id} value={pg.name}>
                    {pg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <div className="group relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bicycle className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{content.sections.paceGroup}</p>
              <p className="font-medium text-foreground text-base">
                {initialPace || auth.setupProfile.noPreference}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsEditing(true)}
            aria-label={`${common.edit} ${content.sections.paceGroup}`}
            className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <PencilSimple className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </ContentCard>
  );
}
