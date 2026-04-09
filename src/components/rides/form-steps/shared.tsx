import { Toggle } from '@/components/ui/switch';
import { appContent } from '@/content/app';

const form = appContent.rides.form;

// ---------------------------------------------------------------------------
// PillToggle — full-width pill-shaped toggle row
// ---------------------------------------------------------------------------

export function PillToggle({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="w-full bg-surface-page rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-muted"
    >
      <span className="text-sm text-foreground">
        {label}: <strong>{checked ? form.toggleOn : form.toggleOff}</strong>
      </span>
      <Toggle id={id} checked={checked} tabIndex={-1} className="pointer-events-none" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// OptionalTag — small "(optional)" label
// ---------------------------------------------------------------------------

export function OptionalTag() {
  return <span className="text-xs font-normal text-muted-foreground ml-1">{form.optional}</span>;
}
