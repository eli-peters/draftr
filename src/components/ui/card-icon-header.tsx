import * as React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

/* ────────────────────────────────────────────────────────────────────────────
 * CardIconHeader — canonical centred icon-above-title card header.
 *
 * One component, one size. No className, no size prop, no typography overrides.
 * Any card that needs a centred icon header uses this — ContentCard delegates
 * to it internally when both `icon` and `heading` are provided.
 *
 * Spec — hero layout, reserve for genuine hero contexts (onboarding, empty
 * states, single hero card on a page, action prompt cards). For routine
 * data sections, use SectionHeading instead — see DESIGN_SYSTEM.md
 * § 15 Centered Icon-Hero Pattern.
 *   Icon  — size-8, regular weight, text-primary
 *   Gap   — mb-2 between icon and title
 *   Title — text-lg font-semibold leading-snug, centred
 * ──────────────────────────────────────────────────────────────────────── */

interface CardIconHeaderProps {
  icon: PhosphorIcon;
  title: string;
}

function CardIconHeader({ icon, title }: CardIconHeaderProps) {
  return (
    <div data-slot="card-icon-header" className="text-center">
      <div className="mb-2 flex justify-center">
        {React.createElement(icon, { weight: 'regular', className: 'size-8 text-primary' })}
      </div>
      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
    </div>
  );
}

export { CardIconHeader };
export type { CardIconHeaderProps };
