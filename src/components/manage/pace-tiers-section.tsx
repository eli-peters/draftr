'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { routes } from '@/config/routes';
import { Plus, Check, X, ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPresets } from '@/lib/motion';
import { InlineEditTransition } from '@/components/motion/inline-edit-transition';
import { Button } from '@/components/ui/button';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/ui/section-heading';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeaderCell,
  AdminTableKebab,
  adminTableRowClasses,
} from '@/components/manage/admin-table';
import { appContent } from '@/content/app';
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

// Uses the bold -text colour (not the pastel -bg) as swatch fill for visual prominence
const PACE_SWATCH_CLASSES = [
  'bg-badge-pace-1-text',
  'bg-badge-pace-2-text',
  'bg-badge-pace-3-text',
  'bg-badge-pace-4-text',
  'bg-badge-pace-5-text',
  'bg-badge-pace-6-text',
];

function parseNum(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseNumInt(val: string): number | null {
  const n = Number.parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function formatRange(min: number | null, max: number | null, unit: string): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `${min}–${max} ${unit}`;
  if (min != null) return `${min}+ ${unit}`;
  return content.upTo(max!, unit);
}

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

interface PaceTiersSectionProps {
  clubId: string;
  initialTiers: PaceTierWithUsage[];
}

export function PaceTiersSection({ clubId, initialTiers }: PaceTiersSectionProps) {
  const { listItem } = useMotionPresets();
  const [tiers, setTiers] = useState(initialTiers);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({
    name: '',
    movingPaceMin: '',
    movingPaceMax: '',
    distanceMin: '',
    distanceMax: '',
  });

  function startEdit(tier: PaceTierWithUsage) {
    setEditingTierId(tier.id);
    setEdit(toEditState(tier));
  }

  function cancelEdit() {
    setEditingTierId(null);
  }

  function handleSaveEdit() {
    if (!editingTierId || !edit.name.trim()) {
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
      const result = await updatePaceTier(editingTierId, updates);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        setTiers((prev) =>
          prev.map((t) =>
            t.id === editingTierId
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
        setEditingTierId(null);
        toast.success(content.saved, { duration: 3000 });
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') cancelEdit();
    if (e.key === 'Enter') handleSaveEdit();
  }

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
            id: result.id ?? crypto.randomUUID(),
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

  function handleDelete(tier: PaceTierWithUsage) {
    startTransition(async () => {
      const result = await deletePaceTier(tier.id);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
        return;
      }

      setTiers((prev) => prev.filter((t) => t.id !== tier.id));
      if (editingTierId === tier.id) setEditingTierId(null);

      toast.success(content.deleted, {
        duration: 5000,
        action: {
          label: content.undo,
          onClick: () => {
            startTransition(async () => {
              const undoResult = await addPaceTier(clubId, tier.name);
              if (!undoResult.error) {
                setTiers((prev) => [
                  ...prev,
                  { ...tier, id: undoResult.id ?? crypto.randomUUID() },
                ]);
                toast.info(content.restored, {
                  duration: 3000,
                  icon: <ArrowCounterClockwise weight="fill" className="size-7" />,
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
    <div className="space-y-3">
      <SectionHeading as="h3">{content.heading}</SectionHeading>

      <AdminTable>
        <AdminTableHead>
          <th className="w-8 p-3" />
          <AdminTableHeaderCell>{content.nameColumn}</AdminTableHeaderCell>
          <AdminTableHeaderCell>{content.paceRangeColumn}</AdminTableHeaderCell>
          <AdminTableHeaderCell>{content.distanceColumn}</AdminTableHeaderCell>
          <AdminTableHeaderCell>{content.ridesColumn}</AdminTableHeaderCell>
          <th className="w-10 p-3" />
        </AdminTableHead>
        <tbody>
          <AnimatePresence initial={false}>
            {tiers.map((tier, index) => {
              const swatchClass = PACE_SWATCH_CLASSES[Math.min(index, MAX_PACE_TIERS - 1)];
              const isEditing = editingTierId === tier.id;

              if (isEditing) {
                return (
                  <motion.tr
                    key={tier.id}
                    layout
                    variants={listItem}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="border-b border-(--border-subtle) last:border-b-0 bg-muted/30"
                    onKeyDown={handleKeyDown}
                  >
                    <td className="p-3">
                      <div className={`h-4 w-4 rounded-full ${swatchClass}`} />
                    </td>
                    <td className="p-3">
                      <Input
                        value={edit.name}
                        onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                        className="h-7 w-32 font-sans text-sm"
                        autoFocus
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={edit.movingPaceMin}
                          onChange={(e) => setEdit({ ...edit, movingPaceMin: e.target.value })}
                          className="h-7 w-16 font-sans text-sm"
                          placeholder={content.minPlaceholder}
                          min={content.paceRange.min}
                          max={content.paceRange.max}
                          step={content.paceRange.step}
                        />
                        <span className="text-xs text-(--text-tertiary)">–</span>
                        <Input
                          type="number"
                          value={edit.movingPaceMax}
                          onChange={(e) => setEdit({ ...edit, movingPaceMax: e.target.value })}
                          className="h-7 w-16 font-sans text-sm"
                          placeholder={content.maxPlaceholder}
                          min={content.paceRange.min}
                          max={content.paceRange.max}
                          step={content.paceRange.step}
                        />
                        <span className="text-xs text-(--text-tertiary)">{content.rangeUnit}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={edit.distanceMin}
                          onChange={(e) => setEdit({ ...edit, distanceMin: e.target.value })}
                          className="h-7 w-16 font-sans text-sm"
                          placeholder={content.minPlaceholder}
                          min={content.distanceRange.min}
                          max={content.distanceRange.max}
                          step={content.distanceRange.step}
                        />
                        <span className="text-xs text-(--text-tertiary)">–</span>
                        <Input
                          type="number"
                          value={edit.distanceMax}
                          onChange={(e) => setEdit({ ...edit, distanceMax: e.target.value })}
                          className="h-7 w-16 font-sans text-sm"
                          placeholder={content.maxPlaceholder}
                          min={content.distanceRange.min}
                          max={content.distanceRange.max}
                          step={content.distanceRange.step}
                        />
                        <span className="text-xs text-(--text-tertiary)">
                          {content.distanceUnit}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-sans text-xs text-(--text-primary)">
                      {tier.upcoming_ride_count}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleSaveEdit}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <ButtonSpinner className="size-3.5" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={cancelEdit}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              }

              // Static display row
              const paceRange = formatRange(
                tier.moving_pace_min,
                tier.moving_pace_max,
                content.rangeUnit,
              );
              const distanceRange = formatRange(
                tier.typical_distance_min,
                tier.typical_distance_max,
                content.distanceUnit,
              );

              return (
                <motion.tr
                  key={tier.id}
                  layout
                  variants={listItem}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={adminTableRowClasses}
                >
                  <td className="p-3">
                    <div className={`h-4 w-4 rounded-full ${swatchClass}`} />
                  </td>
                  <td className="p-3 font-sans text-xs font-medium text-(--text-primary)">
                    {tier.name}
                  </td>
                  <td className="p-3 font-sans text-xs tabular-nums text-(--text-primary)">
                    {paceRange}
                  </td>
                  <td className="p-3 font-sans text-xs tabular-nums text-(--text-primary)">
                    {distanceRange}
                  </td>
                  <td className="p-3 font-sans text-xs tabular-nums text-(--text-primary)">
                    {tier.upcoming_ride_count > 0 ? (
                      <Link href={`${routes.manageRides}?pace=${tier.id}`}>
                        <Button variant="ghost" size="xs" className="text-(--text-tertiary)">
                          {tier.upcoming_ride_count}
                        </Button>
                      </Link>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <AdminTableKebab />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(tier)}>
                          {content.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                        >
                          {content.moveUp}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === tiers.length - 1}
                        >
                          {content.moveDown}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(tier)}
                        >
                          {content.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </AdminTable>

      <InlineEditTransition
        editing={isAdding}
        edit={
          <div className="flex items-center gap-3 rounded-md border border-(--border-subtle) px-3 py-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={content.namePlaceholder}
              className="h-8 flex-1 font-sans"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button variant="ghost" size="icon-sm" onClick={handleAdd} disabled={isPending}>
              {isPending ? <ButtonSpinner /> : <Check className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setIsAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        }
        view={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            disabled={tiers.length >= MAX_PACE_TIERS}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {content.addButton}
          </Button>
        }
      />
    </div>
  );
}
