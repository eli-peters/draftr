'use client';

import { useState, useTransition } from 'react';
import { format } from 'date-fns';
import { PencilSimple, Check, X } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { DatePicker } from '@/components/ui/date-picker';
import { SectionHeading } from '@/components/ui/section-heading';
import { InlineEditTransition } from '@/components/motion/inline-edit-transition';
import { appContent } from '@/content/app';
import { updateSeasonDates } from '@/lib/manage/actions';

const { manage: content } = appContent;
const season = content.season;

interface SeasonDatesSectionProps {
  clubId: string;
  seasonStart: string;
  seasonEnd: string;
}

function formatSeasonDate(dateStr: string): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function SeasonDatesSection({ clubId, seasonStart, seasonEnd }: SeasonDatesSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [start, setStart] = useState(seasonStart);
  const [end, setEnd] = useState(seasonEnd);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateSeasonDates(clubId, start, end);
      if (result.success) {
        setIsEditing(false);
      }
    });
  }

  function handleCancel() {
    setStart(seasonStart);
    setEnd(seasonEnd);
    setIsEditing(false);
  }

  const hasSeasonDates = seasonStart || seasonEnd;

  return (
    <div className="space-y-3">
      <SectionHeading as="h3">{season.heading}</SectionHeading>
      <p className="font-sans text-xs text-(--text-tertiary)">{season.description}</p>

      <InlineEditTransition
        editing={isEditing}
        edit={
          <div className="flex items-end gap-3">
            <FloatingField label={season.startLabel} htmlFor="season-start" hasValue={!!start}>
              <DatePicker id="season-start" value={start} onChange={setStart} />
            </FloatingField>
            <span className="pb-2 text-(--text-tertiary)">–</span>
            <FloatingField label={season.endLabel} htmlFor="season-end" hasValue={!!end}>
              <DatePicker id="season-end" value={end} onChange={setEnd} />
            </FloatingField>
            <Button variant="ghost" size="icon-sm" onClick={handleSave} disabled={isPending}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        }
        view={
          <div className="flex items-center gap-2">
            {hasSeasonDates ? (
              <span className="font-sans text-xs text-(--text-primary)">
                {formatSeasonDate(seasonStart)} – {formatSeasonDate(seasonEnd)}
              </span>
            ) : (
              <span className="font-sans text-xs text-(--text-tertiary)">{season.noSeason}</span>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => setIsEditing(true)}>
              <PencilSimple className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />
    </div>
  );
}
