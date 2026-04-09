/* ---------------------------------------------------------------------------
 * SettingRow — layout primitive for a labelled settings row.
 *
 * Label (and optional description) on the left, control on the right. Shared
 * across the Preferences and Notifications cards so row density stays in sync.
 * -------------------------------------------------------------------------*/

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
