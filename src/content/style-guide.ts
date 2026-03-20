export const styleGuideContent = {
  meta: {
    title: 'Draftr Design System',
    subtitle: 'Colour primitives, semantic tokens, typography, and component patterns',
  },
  tabs: {
    colours: 'Colours',
    typography: 'Typography',
    components: 'Components',
  },
  colours: {
    primitivesTitle: 'Colour ramps',
    primitivesDesc:
      'Full 50–950 ramps for every palette colour. Click any swatch to copy its hex value.',
    semanticTitle: 'Semantic tokens',
    semanticDesc:
      'Intent-based tokens that reference primitives. Light and dark values shown side by side. Components use these — never raw hex.',
    surfacesTitle: 'Surfaces & backgrounds',
    surfacesDesc:
      'Layered surface system for cards, modals, and page backgrounds. Toggle dark mode to see how these adapt.',
    bordersTitle: 'Borders',
    bordersDesc: 'Three border intensities plus a focus ring colour tied to the primary.',
    textTitle: 'Text & foreground',
    textDesc: 'Semantic text colours with contrast ratios against the current background.',
    statesTitle: 'Feedback states',
    statesDesc:
      'Error, success, warning, and info — as banner components showing background, text, and icon treatment.',
    contrastTitle: 'Accessibility audit',
    contrastDesc:
      'WCAG 2.1 contrast ratios for key pairings. AA requires 4.5:1 for normal text, 3:1 for large text.',
  },
  typography: {
    pairingTitle: 'Font pairing',
    pairingDesc:
      'Three fonts, three jobs. Outfit for display, DM Sans for body, JetBrains Mono for data.',
    scaleTitle: 'Type scale',
    scaleDesc:
      'Based on a 1.25 major-third ratio with a 16px base. Each step has a designated font family, weight, and line-height.',
    weightTitle: 'Weight map',
    weightDesc:
      'Constrained weight subsets prevent "weight soup" — that mushy feeling when five different weights compete on one screen.',
  },
  components: {
    buttonsTitle: 'Buttons',
    buttonsDesc:
      'See how the primary and secondary interact at button-scale. The secondary recedes naturally.',
    cardsTitle: 'Cards',
    cardsDesc:
      'Ride cards using the full colour system — surfaces, borders, badges, text hierarchy.',
    inputsTitle: 'Form inputs',
    inputsDesc: 'Focus rings use the primary colour. Error states use the error palette.',
    bannersTitle: 'Banners',
    bannersDesc: 'Feedback banners for success, warning, error, and info states.',
  },
  rampLabels: {
    primary: 'Primary — Magenta',
    secondary: 'Secondary — Deep Teal',
    neutral: 'Neutral — Warm Slate',
    success: 'Success — Warm Green',
    warning: 'Warning — Amber',
    error: 'Error — True Red',
    info: 'Info — Slate Blue',
  },
} as const;
