'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormContext } from 'react-hook-form';
import { ActionBar } from '@/components/ui/action-bar';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogClose,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { appContent } from '@/content/app';

const { rides: ridesContent, common } = appContent;
const form = ridesContent.form;

interface RideFormActionBarProps {
  isEdit: boolean;
  isPending: boolean;
  error: string | null;
}

export function RideFormActionBar({ isEdit, isPending, error }: RideFormActionBarProps) {
  const router = useRouter();
  const {
    formState: { isDirty },
  } = useFormContext();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCancel = () => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      router.back();
    }
  };

  return (
    <>
      <ActionBar>
        {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
        <div className="flex w-full items-center justify-between gap-3">
          <Button type="button" variant="muted" size="sm" onClick={handleCancel}>
            {isEdit ? common.discard : common.cancel}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
          </Button>
        </div>
      </ActionBar>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{form.discardConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit ? form.discardConfirmEditDescription : form.discardConfirmCreateDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              {form.discardConfirmKeep}
            </AlertDialogClose>
            <Button variant="destructive" onClick={() => router.back()}>
              {form.discardConfirmAction}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
