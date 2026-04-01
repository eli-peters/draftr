import { Switch } from '@/components/ui/switch';
import { appContent } from '@/content/app';

const form = appContent.rides.form;

// ---------------------------------------------------------------------------
// StepHeader — centered icon + conversational heading inside a step card
// ---------------------------------------------------------------------------

export function StepHeader({ heading, icon: Icon }: { heading: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center gap-1.5 pb-4 pt-1">
      <Icon weight="duotone" className="size-6 text-primary" />
      <h3 className="font-display text-base font-medium text-foreground text-center">{heading}</h3>
    </div>
  );
}

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
        {label}: <strong>{checked ? 'On' : 'Off'}</strong>
      </span>
      <Switch id={id} checked={checked} tabIndex={-1} className="pointer-events-none" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// OptionalTag — small "(optional)" label
// ---------------------------------------------------------------------------

export function OptionalTag() {
  return <span className="text-xs font-normal text-muted-foreground ml-1">{form.optional}</span>;
}
