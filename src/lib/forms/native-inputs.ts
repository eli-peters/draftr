/**
 * Capacitor / iOS / Android-friendly input attribute presets.
 *
 * Spreading one of these onto an Input/Textarea wires up the right
 * mobile keyboard, return-key label, autocapitalize behaviour, and
 * password-manager hints so the form feels native inside the
 * Capacitor WebView.
 *
 * Usage:
 *   <Input {...nativeInputPresets.email} {...field} />
 *   <Input {...nativeInputPresets.password.current} {...field} />
 *
 * Reference:
 *   - autocomplete tokens: https://developer.mozilla.org/docs/Web/HTML/Attributes/autocomplete
 *   - inputmode: https://developer.mozilla.org/docs/Web/HTML/Global_attributes/inputmode
 *   - enterkeyhint: https://developer.mozilla.org/docs/Web/HTML/Global_attributes/enterkeyhint
 */

type NativeInputPreset = {
  type?: 'text' | 'email' | 'tel' | 'url' | 'number' | 'password' | 'search';
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search' | 'none';
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
  autoComplete?: string;
  autoCapitalize?: 'off' | 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: 'on' | 'off';
  spellCheck?: boolean;
};

export const nativeInputPresets = {
  email: {
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    enterKeyHint: 'next',
  },
  password: {
    current: {
      type: 'password',
      autoComplete: 'current-password',
      autoCapitalize: 'none',
      autoCorrect: 'off',
      spellCheck: false,
      enterKeyHint: 'go',
    },
    new: {
      type: 'password',
      autoComplete: 'new-password',
      autoCapitalize: 'none',
      autoCorrect: 'off',
      spellCheck: false,
      enterKeyHint: 'next',
    },
    confirm: {
      type: 'password',
      autoComplete: 'new-password',
      autoCapitalize: 'none',
      autoCorrect: 'off',
      spellCheck: false,
      enterKeyHint: 'go',
    },
  },
  firstName: {
    type: 'text',
    autoComplete: 'given-name',
    autoCapitalize: 'words',
    autoCorrect: 'off',
    enterKeyHint: 'next',
  },
  lastName: {
    type: 'text',
    autoComplete: 'family-name',
    autoCapitalize: 'words',
    autoCorrect: 'off',
    enterKeyHint: 'next',
  },
  fullName: {
    type: 'text',
    autoComplete: 'name',
    autoCapitalize: 'words',
    autoCorrect: 'off',
    enterKeyHint: 'next',
  },
  phone: {
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    enterKeyHint: 'next',
  },
  url: {
    type: 'url',
    inputMode: 'url',
    autoComplete: 'url',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    enterKeyHint: 'go',
  },
  search: {
    type: 'search',
    inputMode: 'search',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    enterKeyHint: 'search',
  },
  numeric: {
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'off',
    enterKeyHint: 'next',
  },
  decimal: {
    type: 'text',
    inputMode: 'decimal',
    autoComplete: 'off',
    enterKeyHint: 'next',
  },
  otp: {
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'one-time-code',
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    enterKeyHint: 'go',
  },
  /** Free-text fields that benefit from autocorrect (titles, descriptions, bios) */
  prose: {
    type: 'text',
    autoCapitalize: 'sentences',
    autoCorrect: 'on',
    spellCheck: true,
    enterKeyHint: 'next',
  },
  /** Multi-line composer (textarea) — sentences + send key */
  composer: {
    autoCapitalize: 'sentences',
    autoCorrect: 'on',
    spellCheck: true,
    enterKeyHint: 'send',
  },
} satisfies Record<string, NativeInputPreset | Record<string, NativeInputPreset>>;

export type { NativeInputPreset };
