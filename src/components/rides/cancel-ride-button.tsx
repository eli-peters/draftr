'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
import { StatusCallout } from '@/components/ui/status-callout';
import { Textarea } from '@/components/ui/textarea';
import { cancelRide } from '@/lib/rides/actions';
import { appContent } from '@/content/app';
import { routes } from '@/config/routes';

const { rides: ridesContent, common } = appContent;

interface CancelRideButtonProps {
  rideId: string;
  rideTitle: string;
}

export function CancelRideButton({ rideId, rideTitle }: CancelRideButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setIsPending(true);
    setError(null);

    const result = await cancelRide(rideId, reason);
    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(routes.manageRides);
    }
  }

  if (!showConfirm) {
    return (
      <Button variant="link-destructive" size="sm" onClick={() => setShowConfirm(true)}>
        {ridesContent.edit.cancelRide}
      </Button>
    );
  }

  return (
    <StatusCallout tone="error" className="space-y-4 p-5">
      <p className="text-sm font-semibold">{ridesContent.edit.cancelConfirm(rideTitle)}</p>
      <FloatingField
        label={ridesContent.edit.cancelReasonLabel}
        htmlFor="cancel-reason"
        hasValue={!!reason}
        maxLength={300}
      >
        <Textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder=" "
          maxLength={300}
        />
      </FloatingField>
      {error && <p className="text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
          {isPending ? common.loading : ridesContent.edit.confirmCancel}
        </Button>
        <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>
          {ridesContent.edit.keepRide}
        </Button>
      </div>
    </StatusCallout>
  );
}
