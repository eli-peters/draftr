'use client';

import { Button } from '@/components/ui/button';
import { DrawerBody, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer';
import { appContent } from '@/content/app';

const { profile: content, common } = appContent;

interface PhotoPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPhoto: boolean;
  onChooseFromLibrary: () => void;
  onTakePhoto: () => void;
  onRemovePhoto: () => void;
}

export function PhotoPickerSheet({
  open,
  onOpenChange,
  hasPhoto,
  onChooseFromLibrary,
  onTakePhoto,
  onRemovePhoto,
}: PhotoPickerSheetProps) {
  return (
    <ResponsiveDrawer open={open} onOpenChange={onOpenChange} size="auto">
      <DrawerHeader>
        <DrawerTitle className="sr-only">{content.avatar.uploadButton}</DrawerTitle>
        <DrawerDescription className="sr-only">{content.avatar.uploadButton}</DrawerDescription>
      </DrawerHeader>
      <DrawerBody className="flex flex-col gap-3.5 pb-6">
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            onOpenChange(false);
            onChooseFromLibrary();
          }}
        >
          {content.photoPicker.chooseFromLibrary}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            onOpenChange(false);
            onTakePhoto();
          }}
        >
          {content.photoPicker.takePhoto}
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
          {common.cancel}
        </Button>
        {hasPhoto && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-destructive"
            onClick={() => {
              onOpenChange(false);
              onRemovePhoto();
            }}
          >
            {content.photoPicker.removePhoto}
          </Button>
        )}
      </DrawerBody>
    </ResponsiveDrawer>
  );
}
