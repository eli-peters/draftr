'use client';

import Link from 'next/link';
import { useCallback, useRef, useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChatCircle, PaperPlaneTilt } from '@phosphor-icons/react';
import { ButtonSpinner } from '@/components/ui/button-spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPresets } from '@/lib/motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { formatName } from '@/lib/names';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ContentCard } from '@/components/ui/content-card';
import { useCompositionSafe } from '@/hooks/use-composition-safe';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { addComment, editComment, deleteComment, toggleCommentReaction } from '@/lib/rides/actions';
import { ReactionPills } from '@/components/rides/reaction-pills';
import { appContent } from '@/content/app';
import { inputLimits, shouldShowCounter, usePasteTruncate } from '@/lib/forms';
import { cn, getInitial } from '@/lib/utils';
import { routes } from '@/config/routes';
import type { CommentWithUser, ReactionType, ReactionSummary } from '@/types/database';

const content = appContent.rides.comments;
const CHAR_LIMIT = inputLimits.comment.body;
const MAX_ROWS = 4;

interface RideCommentsProps {
  rideId: string;
  comments: CommentWithUser[];
  commentReactions: Map<string, ReactionSummary[]>;
  currentUserId: string | null;
  userRole: string;
  isCancelled: boolean;
}

export function RideComments({
  rideId,
  comments,
  commentReactions,
  currentUserId,
  userRole,
  isCancelled,
}: RideCommentsProps) {
  return (
    <ContentCard heading={content.heading} icon={ChatCircle}>
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">{content.noComments}</p>
      )}

      {comments.length > 0 && (
        <div className="space-y-0.5">
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                reactions={commentReactions.get(comment.id) ?? []}
                currentUserId={currentUserId}
                isAdmin={userRole === 'admin'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {currentUserId && !isCancelled && <AddCommentForm rideId={rideId} />}
    </ContentCard>
  );
}

function autoExpand(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function CommentRow({
  comment,
  reactions,
  currentUserId,
  isAdmin,
}: {
  comment: CommentWithUser;
  reactions: ReactionSummary[];
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isPending, startTransition] = useTransition();
  const editRef = useRef<HTMLTextAreaElement>(null);
  const handleEditPaste = usePasteTruncate(CHAR_LIMIT);

  const editCompositionProps = useCompositionSafe(
    useCallback((value: string) => {
      setEditBody(value);
      if (editRef.current) autoExpand(editRef.current);
    }, []),
  );

  const { listItem } = useMotionPresets();
  const isOwn = currentUserId === comment.user_id;
  const canModify = isOwn || isAdmin;
  const wasEdited = comment.updated_at !== comment.created_at;

  function handleSaveEdit() {
    startTransition(async () => {
      const result = await editComment(comment.id, editBody);
      if (result.success) setIsEditing(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!result.success) toast.error(content.deleteFailed);
      setDeleteOpen(false);
    });
  }

  return (
    <motion.div
      layout
      variants={listItem}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex gap-2 rounded-lg px-2 py-1.5"
    >
      <Avatar className="h-6 w-6 shrink-0">
        {comment.avatar_url && <AvatarImage src={comment.avatar_url} alt={comment.user_name} />}
        <AvatarFallback
          className={`text-caption-sm font-medium ${getAvatarColourClasses(comment.user_name)}`}
        >
          {getInitial(comment.user_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link
            href={routes.publicProfile(comment.user_id)}
            className="text-sm font-medium text-foreground hover:underline"
          >
            {formatName(comment.user_name, { context: 'list' }) || comment.user_name}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {wasEdited && (
            <span className="text-xs italic text-muted-foreground">{content.edited}</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-1.5">
            <Textarea
              ref={editRef}
              value={editBody}
              {...editCompositionProps}
              onPaste={handleEditPaste}
              maxLength={CHAR_LIMIT}
              rows={1}
              className="min-h-0 resize-none overflow-hidden py-2 text-sm"
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={isPending || !editBody.trim()}>
                  {content.save}
                </Button>
                <Button
                  size="sm"
                  variant="muted"
                  onClick={() => {
                    setIsEditing(false);
                    setEditBody(comment.body);
                  }}
                >
                  {content.cancelEdit}
                </Button>
              </div>
              <CharCounter length={editBody.length} max={CHAR_LIMIT} />
            </div>
          </div>
        ) : (
          <p className="mt-0.5 select-text whitespace-pre-line text-sm text-foreground/80">
            {comment.body}
          </p>
        )}

        {canModify && !isEditing && (
          <div className="mt-0.5 flex gap-3">
            {isOwn && (
              <Button
                variant="muted"
                size="xs"
                onClick={() => setIsEditing(true)}
                className="text-overline"
              >
                {content.edit}
              </Button>
            )}
            <Button
              variant="muted"
              size="xs"
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
              className="text-overline hover:text-destructive"
            >
              {content.delete}
            </Button>
          </div>
        )}

        {/* Comment reactions */}
        <div className="mt-1">
          <ReactionPills
            reactions={reactions}
            onToggle={async (reaction: ReactionType) => {
              await toggleCommentReaction(comment.id, reaction);
            }}
            currentUserId={currentUserId}
          />
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{content.deleteConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{content.deleteConfirm}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose
                render={
                  <Button variant="ghost" size="sm" disabled={isPending}>
                    {content.cancelEdit}
                  </Button>
                }
              />
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                {isPending ? <ButtonSpinner /> : null}
                {isPending ? appContent.common.loading : content.delete}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

function AddCommentForm({ rideId }: { rideId: string }) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handlePaste = usePasteTruncate(CHAR_LIMIT);

  const commentCompositionProps = useCompositionSafe(
    useCallback((value: string) => {
      setBody(value);
      if (textareaRef.current) autoExpand(textareaRef.current);
    }, []),
  );

  function handleSubmit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addComment(rideId, body);
      if (result.success) {
        setBody('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="mt-4 rounded-(--radius-xl) border border-(--border-subtle) bg-(--surface-default) px-2 py-1.5 transition-colors focus-within:border-ring">
      <div className="flex items-end gap-1">
        <Textarea
          id="add-comment"
          ref={textareaRef}
          value={body}
          {...commentCompositionProps}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={content.placeholder}
          maxLength={CHAR_LIMIT}
          rows={1}
          style={{ maxHeight: `${MAX_ROWS * 1.5}rem` }}
          className="min-h-9 w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:outline-none focus-visible:ring-0"
        />
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          disabled={isPending || !body.trim()}
          onClick={handleSubmit}
          aria-label={content.sendAriaLabel}
        >
          {isPending ? <ButtonSpinner /> : <PaperPlaneTilt className="size-4" />}
        </Button>
      </div>
      <div className="flex justify-end px-2 pb-1">
        <CharCounter length={body.length} max={CHAR_LIMIT} />
      </div>
    </div>
  );
}

function CharCounter({ length, max }: { length: number; max: number }) {
  const visible = shouldShowCounter(length, max);
  return (
    <span
      aria-live="polite"
      className={cn(
        'shrink-0 text-xs tabular-nums text-muted-foreground transition-opacity duration-150 motion-reduce:transition-none',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {length}/{max}
    </span>
  );
}
