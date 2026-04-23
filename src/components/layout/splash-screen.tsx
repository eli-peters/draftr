'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const DISPLAY_DURATION_MS = 1200;

export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFading(true), DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-9999    md:flex items-center justify-center bg-background transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1, pointerEvents: fading ? 'none' : 'auto' }}
      onTransitionEnd={() => setGone(true)}
    >
      <Image
        src="/icons/logo.svg"
        alt="Draftr"
        width={180}
        height={42}
        priority
        className="w-36 sm:w-44"
      />
    </div>
  );
}
