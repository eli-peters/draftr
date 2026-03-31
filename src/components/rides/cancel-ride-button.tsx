'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FloatingField } from '@/components/ui/floating-field';
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
      router.push(routes.manage);
    }
  }

  if (!showConfirm) {
    return (
      <Button variant="destructive" className="w-full" onClick={() => setShowConfirm(true)}>
        {ridesContent.edit.cancelRide}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-4">
      <p className="text-sm font-semibold text-destructive">
        {ridesContent.edit.cancelConfirm(rideTitle)}
      </p>
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
          {isPending ? common.loading : ridesContent.edit.confirmCancel}
        </Button>
        <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>
          {ridesContent.edit.keepRide}
        </Button>
      </div>
    </div>
  );
}
