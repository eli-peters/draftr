import { useCallback, useEffect } from 'react';

/**
 * Calls `onEscape` when the Escape key is pressed while `isActive` is true.
 * Used by inline-edit sections to cancel editing.
 */
export function useEscapeKey(isActive: boolean, onEscape: () => void) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isActive) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
      }
    },
    [isActive, onEscape],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
