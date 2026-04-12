import { useRef, useCallback } from 'react';

type InputElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Suppresses controlled-input onChange during active IME/composition
 * (e.g. macOS emoji picker, CJK input) and fires the final value on
 * compositionEnd. Prevents React 19's onChange-during-composition from
 * overwriting the input with partial data.
 *
 * Returns spread-ready props: { onChange, onCompositionStart, onCompositionEnd }
 */
export function useCompositionSafe(onChange: (value: string) => void) {
  const composingRef = useRef(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<InputElement>) => {
      if (!composingRef.current) {
        onChange(e.target.value);
      }
    },
    [onChange],
  );

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<InputElement>) => {
      composingRef.current = false;
      onChange((e.target as InputElement).value);
    },
    [onChange],
  );

  return {
    onChange: handleChange,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
  };
}
