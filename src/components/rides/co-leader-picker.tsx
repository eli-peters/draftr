'use client';

import { useState, useTransition } from 'react';
import { X, UserPlus } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { appContent } from '@/content/app';
import { addCoLeader, removeCoLeader } from '@/lib/rides/actions';

const { rides: ridesContent } = appContent;
const edit = ridesContent.edit;

interface CoLeader {
  user_id: string;
  name: string;
}

interface EligibleLeader {
  user_id: string;
  name: string;
}

interface CoLeaderPickerProps {
  rideId: string;
  coLeaders: CoLeader[];
  eligibleLeaders: EligibleLeader[];
}

export function CoLeaderPicker({ rideId, coLeaders, eligibleLeaders }: CoLeaderPickerProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isPending, startTransition] = useTransition();

  const currentCoLeaderIds = coLeaders.map((cl) => cl.user_id);
  const available = eligibleLeaders.filter((l) => !currentCoLeaderIds.includes(l.user_id));

  function handleAdd() {
    if (!selectedUserId) return;
    startTransition(async () => {
      const result = await addCoLeader(rideId, selectedUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(edit.coLeaderAdded);
        setSelectedUserId('');
      }
    });
  }

  function handleRemove(userId: string) {
    startTransition(async () => {
      const result = await removeCoLeader(rideId, userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(edit.coLeaderRemoved);
      }
    });
  }

  return (
    <div className="space-y-3">
      {coLeaders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {coLeaders.map((cl) => (
            <Badge key={cl.user_id} variant="secondary" className="gap-1.5 pr-1.5">
              {cl.name}
              <button
                type="button"
                onClick={() => handleRemove(cl.user_id)}
                disabled={isPending}
                className="rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">{edit.coLeaderPlaceholder}</option>
              {available.map((l) => (
                <option key={l.user_id} value={l.user_id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={!selectedUserId || isPending}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            {edit.addCoLeader}
          </Button>
        </div>
      )}
      {available.length === 0 && coLeaders.length === 0 && (
        <p className="text-sm text-muted-foreground">{edit.noEligibleLeaders}</p>
      )}
    </div>
  );
}
