import * as React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

/* ────────────────────────────────────────────────────────────────────────────
 * CardIconHeader — canonical centred icon-above-title card header.
 *
 * One component, one size. No className, no size prop, no typography overrides.
 * Any card that needs a centred icon header uses this — ContentCard delegates
 * to it internally when both `icon` and `heading` are provided.
 *
 * Spec (matches the contact information card, the golden standard):
 *   Icon  — size-8, duotone weight, text-primary
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
        {React.createElement(icon, { weight: 'duotone', className: 'size-8 text-primary' })}
      </div>
      <h3 className="text-lg font-semibold leading-snug">{title}</h3>
    </div>
  );
}

export { CardIconHeader };
export type { CardIconHeaderProps };
