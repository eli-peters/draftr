'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {season.heading}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">{season.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="season-start">{season.startLabel}</Label>
          <Input
            id="season-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="season-end">{season.endLabel}</Label>
          <Input
            id="season-end"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {season.save}
        </Button>
        {message && <p className="text-sm text-success">{message}</p>}
      </div>
    </div>
  );
}
