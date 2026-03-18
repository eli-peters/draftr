'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from '@phosphor-icons/react';
import { appContent } from '@/content/app';
import { addWalkUpRider } from '@/lib/rides/actions';

const { rides: ridesContent } = appContent;

interface ClubMember {
  user_id: string;
  name: string;
}

interface WalkUpRiderFormProps {
  rideId: string;
  clubMembers: ClubMember[];
  existingSignupUserIds: string[];
}

export function WalkUpRiderForm({ rideId, clubMembers, existingSignupUserIds }: WalkUpRiderFormProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const availableMembers = clubMembers.filter(
    (m) => !existingSignupUserIds.includes(m.user_id),
  );

  const selectClass =
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  function handleAdd() {
    if (!selectedUserId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addWalkUpRider(rideId, selectedUserId);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(ridesContent.edit.walkUpAdded);
        setSelectedUserId('');
      }
    });
  }

  if (availableMembers.length === 0) return null;

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className={selectClass}
        >
          <option value="">{ridesContent.edit.walkUpPlaceholder}</option>
          {availableMembers.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleAdd}
        disabled={!selectedUserId || isPending}
      >
        <UserPlus weight="bold" className="h-4 w-4 mr-1.5" />
        {ridesContent.edit.addWalkUp}
      </Button>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
