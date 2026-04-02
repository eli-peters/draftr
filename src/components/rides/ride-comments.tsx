'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarColourClasses } from '@/lib/avatar-colours';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FloatingField } from '@/components/ui/floating-field';
import { SectionHeading } from '@/components/ui/section-heading';
import { ContentCard } from '@/components/ui/content-card';
import { toast } from 'sonner';
import { addComment, editComment, deleteComment } from '@/lib/rides/actions';
import { appContent } from '@/content/app';
import { getInitials } from '@/lib/utils';
import { routes } from '@/config/routes';
import type { CommentWithUser } from '@/types/database';

const content = appContent.rides.comments;
const CHAR_LIMIT = 500;

interface RideCommentsProps {
  rideId: string;
  comments: CommentWithUser[];
  currentUserId: string | null;
  userRole: string;
  isCancelled: boolean;
}

export function RideComments({
  rideId,
  comments,
  currentUserId,
  userRole,
  isCancelled,
}: RideCommentsProps) {
  return (
    <div>
      <SectionHeading>{content.heading}</SectionHeading>
      <ContentCard className="mt-3">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">{content.noComments}</p>
        )}

        {comments.length > 0 && (
          <div className="space-y-1">
            {comments.map((comment) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                isAdmin={userRole === 'admin'}
              />
            ))}
          </div>
        )}

        {currentUserId && !isCancelled && <AddCommentForm rideId={rideId} />}
      </ContentCard>
    </div>
  );
}

function CommentRow({
  comment,
  currentUserId,
  isAdmin,
}: {
  comment: CommentWithUser;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isPending, startTransition] = useTransition();

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
    if (!confirm(content.deleteConfirm)) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!result.success) toast.error(content.deleteFailed);
    });
  }

  return (
    <div className="flex gap-3 rounded-lg px-2 py-2.5">
      <Avatar className="h-8 w-8 shrink-0">
        {comment.avatar_url && <AvatarImage src={comment.avatar_url} alt={comment.user_name} />}
        <AvatarFallback
          className={`text-xs font-medium ${getAvatarColourClasses(comment.user_name)}`}
        >
          {getInitials(comment.user_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
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
            <span className="text-xs text-muted-foreground italic">{content.edited}</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-1.5 space-y-2">
            <FloatingField
              label={content.label}
              htmlFor={`edit-comment-${comment.id}`}
              hasValue={!!editBody}
              maxLength={CHAR_LIMIT}
            >
              <Textarea
                id={`edit-comment-${comment.id}`}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder=" "
                maxLength={CHAR_LIMIT}
                rows={2}
              />
            </FloatingField>
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
          <p className="mt-0.5 text-sm text-foreground/80 whitespace-pre-line">{comment.body}</p>
        )}

        {canModify && !isEditing && (
          <div className="mt-1 flex gap-3">
            {isOwn && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {content.edit}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              {content.delete}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddCommentForm({ rideId }: { rideId: string }) {
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addComment(rideId, body);
      if (result.success) setBody('');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <FloatingField
        label={content.label}
        htmlFor="add-comment"
        hasValue={!!body}
        maxLength={CHAR_LIMIT}
      >
        <Textarea
          id="add-comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder=" "
          maxLength={CHAR_LIMIT}
          rows={2}
        />
      </FloatingField>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {content.submit}
        </Button>
      </div>
    </form>
  );
}
