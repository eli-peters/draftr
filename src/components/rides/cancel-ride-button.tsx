"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cancelRide } from "@/lib/rides/actions";
import { appContent } from "@/content/app";

const { rides: ridesContent, common } = appContent;

interface CancelRideButtonProps {
  rideId: string;
  rideTitle: string;
}

export function CancelRideButton({ rideId, rideTitle }: CancelRideButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
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
      router.push("/manage");
    }
  }

  if (!showConfirm) {
    return (
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => setShowConfirm(true)}
      >
        {ridesContent.edit.cancelRide}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-4">
      <p className="text-sm font-semibold text-destructive">
        {ridesContent.edit.cancelConfirm(rideTitle)}
      </p>
      <div className="space-y-2">
        <Label htmlFor="cancel-reason" className="text-sm">{ridesContent.edit.cancelReasonLabel}</Label>
        <textarea
          id="cancel-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={ridesContent.edit.cancelReasonPlaceholder}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
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
