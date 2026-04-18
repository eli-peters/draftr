import type { ComponentProps, ReactNode } from 'react';
import { DotsThree } from '@phosphor-icons/react/dist/ssr';
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface AdminTableProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** <thead> + <tbody> content. Typically AdminTableHead + a <tbody>. */
  children: ReactNode;
  /** Optional footer rendered inside the rounded border (e.g. <TablePagination/>). */
  footer?: ReactNode;
}

/**
 * Shared shell for admin/manage data tables (Members, Rides, Announcements, Pace Groups).
 * One source of truth for chrome so the four surfaces never drift visually.
 */
export function AdminTable({ className, children, footer, ...props }: AdminTableProps) {
  return (
    <div
      className={cn('overflow-x-auto rounded-md border border-(--border-default)', className)}
      {...props}
    >
      <table className="w-full bg-(--surface-default) text-left">{children}</table>
      {footer}
    </div>
  );
}

/** Sticky thead with a single header tr pre-wired. Pass <th>/SortableHeader children. */
export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-(--surface-sunken)">
      <tr className="border-b border-(--border-default)">{children}</tr>
    </thead>
  );
}

/** Non-sortable header cell with overline typography — mirrors SortableHeader styling. */
export function AdminTableHeaderCell({ className, children, ...props }: ComponentProps<'th'>) {
  return (
    <th className={cn('p-3 text-overline font-sans text-(--text-secondary)', className)} {...props}>
      {children}
    </th>
  );
}

/**
 * Row chrome classes. Exported as a string so motion.tr / custom row components can compose
 * it with their own behaviour (cursor-pointer, opacity, etc.) without wrapping.
 */
export const adminTableRowClasses =
  'group border-b border-(--border-subtle) last:border-b-0 hover:bg-muted/50';

/** Standardized kebab trigger for row actions. Sits inside a <DropdownMenu>. */
export function AdminTableKebab({
  className,
  ...props
}: ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-(--text-tertiary) hover:bg-muted/50 hover:text-(--text-primary)',
        className,
      )}
      {...props}
    >
      <DotsThree className="h-4 w-4" weight="bold" />
    </DropdownMenuTrigger>
  );
}
