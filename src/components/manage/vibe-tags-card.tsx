'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash, ArrowUp, ArrowDown, Check, X, ArrowCounterClockwise } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import {
  addVibeTag,
  updateVibeTag,
  deleteVibeTag,
  reorderVibeTags,
} from '@/lib/manage/actions';
import { TOAST_ACTION_STYLES } from '@/lib/toast-styles';
import type { VibeTagWithUsage } from '@/lib/manage/queries';

const content = appContent.manage.vibeTags;

/** Validate tag name: 1–3 words. */
function validateTagName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return content.nameRequired;
  const words = trimmed.split(/\s+/);
  if (words.length > 3) return content.nameTooLong;
  return null;
}

interface VibeTagsCardProps {
  clubId: string;
  initialTags: VibeTagWithUsage[];
}

export function VibeTagsCard({ clubId, initialTags }: VibeTagsCardProps) {
  const [tags, setTags] = useState(initialTags);
  const [isPending, startTransition] = useTransition();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  function handleAdd() {
    const validationError = validateTagName(newName);
    if (validationError) {
      toast.error(validationError, { duration: 6000 });
      return;
    }
    startTransition(async () => {
      const result = await addVibeTag(clubId, newName);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        setTags((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: newName.trim(),
            sort_order: prev.length + 1,
            ride_count: 0,
          },
        ]);
        setIsAdding(false);
        setNewName('');
        toast.success(content.saved, { duration: 3000 });
      }
    });
  }

  function startEdit(tag: VibeTagWithUsage) {
    setEditingId(tag.id);
    setEditName(tag.name);
  }

  function handleSaveEdit() {
    const validationError = validateTagName(editName);
    if (validationError) {
      toast.error(validationError, { duration: 6000 });
      return;
    }
    startTransition(async () => {
      const result = await updateVibeTag(editingId!, { name: editName });
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        setTags((prev) => prev.map((t) => (t.id === editingId ? { ...t, name: editName.trim() } : t)));
        setEditingId(null);
        toast.success(content.saved, { duration: 3000 });
      }
    });
  }

  function handleDelete(tag: VibeTagWithUsage) {
    startTransition(async () => {
      const result = await deleteVibeTag(tag.id);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
        return;
      }

      setTags((prev) => prev.filter((t) => t.id !== tag.id));

      toast.success(content.deleted, {
        duration: 5000,
        action: {
          label: content.undo,
          onClick: () => {
            startTransition(async () => {
              const undoResult = await addVibeTag(clubId, tag.name);
              if (!undoResult.error) {
                setTags((prev) => [...prev, { ...tag, id: crypto.randomUUID() }]);
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
    if (swapIndex < 0 || swapIndex >= tags.length) return;

    const reordered = [...tags];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];
    setTags(reordered);

    startTransition(async () => {
      await reorderVibeTags(
        clubId,
        reordered.map((t) => t.id),
      );
    });
  }

  return (
    <Card className="mt-4 p-5">
      <SectionHeading as="h3" className="mb-1">
        {content.heading}
      </SectionHeading>
      <p className="mb-4 text-sm text-muted-foreground">{content.description}</p>

      {tags.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">{content.noTags}</p>
      )}

      <div className="space-y-2">
        {tags.map((tag, index) => (
          <div
            key={tag.id}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
          >
            {editingId === tag.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                />
                <Button variant="ghost" size="icon-sm" onClick={handleSaveEdit} disabled={isPending}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-foreground">{tag.name}</span>
                {tag.ride_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {content.usageCount(tag.ride_count)}
                  </span>
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
                    disabled={index === tags.length - 1 || isPending}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => startEdit(tag)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(tag)}
                    disabled={isPending}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
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
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsAdding(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          {content.add}
        </Button>
      )}

    </Card>
  );
}
