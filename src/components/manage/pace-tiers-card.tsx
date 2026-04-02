'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { routes } from '@/config/routes';
import {
  Plus,
  Pencil,
  Trash,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  ArrowCounterClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ContentCard } from '@/components/ui/content-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { appContent } from '@/content/app';
import { getPaceBadgeVariant } from '@/config/formatting';
import {
  addPaceTier,
  updatePaceTier,
  deletePaceTier,
  reorderPaceTiers,
} from '@/lib/manage/actions';
import { TOAST_ACTION_STYLES } from '@/lib/toast-styles';
import type { PaceTierWithUsage } from '@/lib/manage/queries';

const content = appContent.manage.paceTiers;
const MAX_PACE_TIERS = 6;

/** Static class names so Tailwind can detect them at build time. */
const PACE_SWATCH_CLASSES = [
  'bg-badge-pace-1-text',
  'bg-badge-pace-2-text',
  'bg-badge-pace-3-text',
  'bg-badge-pace-4-text',
  'bg-badge-pace-5-text',
  'bg-badge-pace-6-text',
];

interface EditState {
  name: string;
  movingPaceMin: string;
  movingPaceMax: string;
  distanceMin: string;
  distanceMax: string;
}

function toEditState(tier: PaceTierWithUsage): EditState {
  return {
    name: tier.name,
    movingPaceMin: tier.moving_pace_min?.toString() ?? '',
    movingPaceMax: tier.moving_pace_max?.toString() ?? '',
    distanceMin: tier.typical_distance_min?.toString() ?? '',
    distanceMax: tier.typical_distance_max?.toString() ?? '',
  };
}

function parseNum(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseNumInt(val: string): number | null {
  const n = Number.parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function formatRange(min: number | null, max: number | null, unit: string): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min}–${max} ${unit}`;
  if (min != null) return `${min}+ ${unit}`;
  return content.upTo(max!, unit);
}

interface PaceTiersCardProps {
  clubId: string;
  initialTiers: PaceTierWithUsage[];
}

export function PaceTiersCard({ clubId, initialTiers }: PaceTiersCardProps) {
  const [tiers, setTiers] = useState(initialTiers);
  const [isPending, startTransition] = useTransition();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({
    name: '',
    movingPaceMin: '',
    movingPaceMax: '',
    distanceMin: '',
    distanceMax: '',
  });

  function handleAdd() {
    if (!newName.trim()) {
      toast.error(content.nameRequired, { duration: 6000 });
      return;
    }
    startTransition(async () => {
      const result = await addPaceTier(clubId, newName);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        setIsAdding(false);
        setNewName('');
        setTiers((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: newName.trim(),
            sort_order: prev.length + 1,
            moving_pace_min: null,
            moving_pace_max: null,
            strava_pace_min: null,
            strava_pace_max: null,
            typical_distance_min: null,
            typical_distance_max: null,
            upcoming_ride_count: 0,
          },
        ]);
        toast.success(content.saved, { duration: 3000 });
      }
    });
  }

  function startEdit(tier: PaceTierWithUsage) {
    setEditingId(tier.id);
    setEdit(toEditState(tier));
  }

  function handleSaveEdit() {
    if (!editingId || !edit.name.trim()) {
      toast.error(content.nameRequired, { duration: 6000 });
      return;
    }
    const updates = {
      name: edit.name,
      moving_pace_min: parseNum(edit.movingPaceMin),
      moving_pace_max: parseNum(edit.movingPaceMax),
      typical_distance_min: parseNumInt(edit.distanceMin),
      typical_distance_max: parseNumInt(edit.distanceMax),
    };
    startTransition(async () => {
      const result = await updatePaceTier(editingId, updates);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        setTiers((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? {
                  ...t,
                  name: edit.name.trim(),
                  moving_pace_min: updates.moving_pace_min,
                  moving_pace_max: updates.moving_pace_max,
                  typical_distance_min: updates.typical_distance_min,
                  typical_distance_max: updates.typical_distance_max,
                }
              : t,
          ),
        );
        setEditingId(null);
        toast.success(content.saved, { duration: 3000 });
      }
    });
  }

  function handleDelete(tier: PaceTierWithUsage) {
    startTransition(async () => {
      const result = await deletePaceTier(tier.id);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
        return;
      }

      // Server confirmed deletion — remove from list
      setTiers((prev) => prev.filter((t) => t.id !== tier.id));

      toast.success(content.deleted, {
        duration: 5000,
        action: {
          label: content.undo,
          onClick: () => {
            startTransition(async () => {
              const undoResult = await addPaceTier(clubId, tier.name);
              if (!undoResult.error) {
                setTiers((prev) => [...prev, { ...tier, id: crypto.randomUUID() }]);
                toast.info(content.restored, {
                  duration: 3000,
                  icon: <ArrowCounterClockwise weight="fill" className="size-4" />,
                });
              }
            });
          },
        },
        actionButtonStyle: TOAST_ACTION_STYLES.success,
      });
    });
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= tiers.length) return;

    const reordered = [...tiers];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setTiers(reordered);

    startTransition(async () => {
      await reorderPaceTiers(
        clubId,
        reordered.map((t) => t.id),
      );
    });
  }

  return (
    <ContentCard className="mt-4" heading={content.heading} subtitle={content.description}>
      <div className="space-y-2">
        {tiers.map((tier, index) => {
          const badgeVariant = getPaceBadgeVariant(index + 1);
          const swatchClass = PACE_SWATCH_CLASSES[Math.min(index, MAX_PACE_TIERS - 1)];
          const paceRange = formatRange(
            tier.moving_pace_min,
            tier.moving_pace_max,
            content.rangeUnit,
          );

          return (
            <div key={tier.id} className="rounded-lg border border-border px-3 py-2">
              {editingId === tier.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-4 w-4 shrink-0 rounded-full ${swatchClass}`} />
                    <Input
                      value={edit.name}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      className="h-8 flex-1"
                      autoFocus
                    />
                  </div>
                  <RangeField
                    label={content.movingPace}
                    unit={content.rangeUnit}
                    min={edit.movingPaceMin}
                    max={edit.movingPaceMax}
                    onMinChange={(v) => setEdit({ ...edit, movingPaceMin: v })}
                    onMaxChange={(v) => setEdit({ ...edit, movingPaceMax: v })}
                    inputMin={content.paceRange.min}
                    inputMax={content.paceRange.max}
                    step={content.paceRange.step}
                  />
                  <RangeField
                    label={content.typicalDistance}
                    unit={content.distanceUnit}
                    min={edit.distanceMin}
                    max={edit.distanceMax}
                    onMinChange={(v) => setEdit({ ...edit, distanceMin: v })}
                    onMaxChange={(v) => setEdit({ ...edit, distanceMax: v })}
                    inputMin={content.distanceRange.min}
                    inputMax={content.distanceRange.max}
                    step={content.distanceRange.step}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                      {content.save}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      {content.cancel}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 shrink-0 rounded-full ${swatchClass}`} />
                  <Badge variant={badgeVariant}>{tier.name}</Badge>
                  <div className="min-w-0 flex-1">
                    {paceRange && (
                      <span className="text-xs text-muted-foreground">{paceRange}</span>
                    )}
                  </div>
                  {tier.upcoming_ride_count > 0 && (
                    <Link href={`${routes.manageTab('rides')}&pace=${tier.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs text-muted-foreground"
                      >
                        {content.upcomingRides(tier.upcoming_ride_count)}
                      </Button>
                    </Link>
                  )}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isPending}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === tiers.length - 1 || isPending}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(tier)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(tier)}
                      disabled={isPending}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdding ? (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-border px-3 py-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={content.namePlaceholder}
            className="h-8 flex-1"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button variant="ghost" size="icon-sm" onClick={handleAdd} disabled={isPending}>
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsAdding(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setIsAdding(true)}
          disabled={tiers.length >= MAX_PACE_TIERS}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {content.add}
        </Button>
      )}
    </ContentCard>
  );
}

// ---------------------------------------------------------------------------
// RangeField — inline min–max input row with constraints
// ---------------------------------------------------------------------------

function RangeField({
  label,
  unit,
  min,
  max,
  onMinChange,
  onMaxChange,
  inputMin,
  inputMax,
  step,
}: {
  label: string;
  unit: string;
  min: string;
  max: string;
  onMinChange: (val: string) => void;
  onMaxChange: (val: string) => void;
  inputMin?: number;
  inputMax?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={min}
        onChange={(e) => onMinChange(e.target.value)}
        className="h-7 w-20 text-sm"
        placeholder={content.minPlaceholder}
        min={inputMin}
        max={inputMax}
        step={step}
      />
      <span className="text-xs text-muted-foreground">–</span>
      <Input
        type="number"
        value={max}
        onChange={(e) => onMaxChange(e.target.value)}
        className="h-7 w-20 text-sm"
        placeholder={content.maxPlaceholder}
        min={inputMin}
        max={inputMax}
        step={step}
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}
