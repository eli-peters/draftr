'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChatCircle, PaperPlaneTilt } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMotionPresets } from '@/lib/motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FloatingField } from '@/components/ui/floating-field';
import { ContentCard } from '@/components/ui/content-card';
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
import { getInitial } from '@/lib/utils';
import { routes } from '@/config/routes';
import type { CommentWithUser, ReactionType, ReactionSummary } from '@/types/database';

const content = appContent.rides.comments;
const CHAR_LIMIT = 500;
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
        <p className="text-center text-sm text-muted-foreground">{content.noComments}</p>
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
            {comment.user_name}
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
              onChange={(e) => {
                setEditBody(e.target.value);
                autoExpand(e.currentTarget);
              }}
              maxLength={CHAR_LIMIT}
              rows={1}
              className="min-h-0 resize-none overflow-hidden py-2 text-sm"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={isPending || !editBody.trim()}>
                {content.save}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditBody(comment.body);
                }}
              >
                {content.cancelEdit}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-line text-sm text-foreground/80">{comment.body}</p>
        )}

        {canModify && !isEditing && (
          <div className="mt-0.5 flex gap-3">
            {isOwn && (
              <Button
                variant="link"
                size="xs"
                onClick={() => setIsEditing(true)}
                className="text-overline text-muted-foreground hover:text-foreground"
              >
                {content.edit}
              </Button>
            )}
            <Button
              variant="link"
              size="xs"
              onClick={() => setDeleteOpen(true)}
              disabled={isPending}
              className="text-overline text-muted-foreground hover:text-destructive"
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
                  <Button variant="outline" size="sm" disabled={isPending}>
                    {content.cancelEdit}
                  </Button>
                }
              />
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
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
    <FloatingField
      label={content.placeholder}
      htmlFor="add-comment"
      hasValue={body.length > 0}
      className="mt-3"
    >
      <div className="relative border-b border-input transition-colors focus-within:border-ring">
        <Textarea
          id="add-comment"
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            autoExpand(e.currentTarget);
          }}
          onKeyDown={handleKeyDown}
          placeholder=" "
          maxLength={CHAR_LIMIT}
          rows={1}
          style={{ maxHeight: `${MAX_ROWS * 1.5}rem` }}
          className="w-full resize-none border-0 bg-transparent pr-10 text-sm shadow-none focus-visible:outline-none focus-visible:ring-0"
        />
        <Button
          size="icon"
          variant="ghost"
          className="absolute bottom-0 right-0 shrink-0 text-muted-foreground hover:bg-action-primary-subtle-bg hover:text-primary"
          disabled={isPending || !body.trim()}
          onClick={handleSubmit}
          aria-label={content.sendAriaLabel}
        >
          <PaperPlaneTilt className="size-4" />
        </Button>
      </div>
    </FloatingField>
  );
}
