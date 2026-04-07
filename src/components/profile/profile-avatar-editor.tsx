'use client';

import { useRef, useTransition, useState } from 'react';
import { Camera } from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { uploadAvatar, removeAvatar } from '@/lib/profile/actions';
import { appContent } from '@/content/app';
import { DURATIONS, EASE } from '@/lib/motion';

const { profile: content } = appContent;

interface ProfileAvatarEditorProps {
  avatarUrl: string | null;
  fullName: string;
  initials: string;
}

export function ProfileAvatarEditor({ avatarUrl, fullName, initials }: ProfileAvatarEditorProps) {
  const [avatarPreview, setAvatarPreview] = useState(avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarError(null);

    const formData = new FormData();
    formData.append('avatar', file);
    startUpload(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) {
        setAvatarError(result.error);
        setAvatarPreview(avatarUrl);
      } else if (result.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
      }
    });
  }

  return (
    <div className="flex flex-col items-center">
      <motion.button
        type="button"
        className="relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: DURATIONS.fast, ease: EASE.out }}
      >
        <div className="relative h-24 w-24">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={avatarPreview ?? 'empty'}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: DURATIONS.normal, ease: EASE.out }}
              className="absolute inset-0"
            >
              <Avatar className="h-24 w-24 ring-2 ring-primary/20 transition-opacity group-hover:opacity-80">
                {avatarPreview && <AvatarImage src={avatarPreview} alt={fullName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background transition-transform group-hover:scale-110">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </motion.button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />
      {isUploading && (
        <p className="mt-2 text-sm text-muted-foreground">{content.avatar.uploading}</p>
      )}
      {avatarPreview && !isUploading && (
        <button
          type="button"
          className="mt-2 text-sm text-destructive hover:underline"
          onClick={() => {
            if (!window.confirm(content.avatar.removeConfirm)) return;
            startUpload(async () => {
              const result = await removeAvatar();
              if (result.error) {
                setAvatarError(result.error);
              } else {
                setAvatarPreview(null);
              }
            });
          }}
        >
          {content.avatar.removeButton}
        </button>
      )}
      {avatarError && <p className="mt-1 text-sm text-destructive">{avatarError}</p>}
    </div>
  );
}
