'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { DatePicker } from '@/components/ui/date-picker';
import { appContent } from '@/content/app';
import { updateSeasonDates } from '@/lib/manage/actions';

const { manage: content } = appContent;
const season = content.season;

interface SeasonDatesCardProps {
  clubId: string;
  seasonStart: string;
  seasonEnd: string;
}

export function SeasonDatesCard({ clubId, seasonStart, seasonEnd }: SeasonDatesCardProps) {
  const [start, setStart] = useState(seasonStart);
  const [end, setEnd] = useState(seasonEnd);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateSeasonDates(clubId, start, end);
      if (result.success) {
        setMessage(season.saved);
      }
    });
  }

  return (
    <ContentCard heading={season.heading} subtitle={season.description}>
      <div className="grid grid-cols-2 gap-4">
        <FloatingField label={season.startLabel} htmlFor="season-start" hasValue={!!start}>
          <DatePicker id="season-start" value={start} onChange={setStart} />
        </FloatingField>
        <FloatingField label={season.endLabel} htmlFor="season-end" hasValue={!!end}>
          <DatePicker id="season-end" value={end} onChange={setEnd} />
        </FloatingField>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {season.save}
        </Button>
        {message && <p className="text-sm text-success">{message}</p>}
      </div>
    </ContentCard>
  );
}
