'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { SectionHeading } from '@/components/ui/section-heading';
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
    <Card className="p-5">
      <SectionHeading as="h3" className="mb-1">
        {season.heading}
      </SectionHeading>
      <p className="text-sm text-muted-foreground mb-4">{season.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="season-start">{season.startLabel}</Label>
          <DatePicker id="season-start" value={start} onChange={setStart} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="season-end">{season.endLabel}</Label>
          <DatePicker id="season-end" value={end} onChange={setEnd} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {season.save}
        </Button>
        {message && <p className="text-sm text-success">{message}</p>}
      </div>
    </Card>
  );
}
