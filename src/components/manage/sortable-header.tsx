import { CaretUp, CaretDown } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/utils';

export type SortDir = 'asc' | 'desc';

interface SortableHeaderProps<K extends string> {
  label: string;
  sortKey: K;
  currentKey: K;
  currentDir: SortDir;
  onSort: (key: K) => void;
  className?: string;
}

export function SortableHeader<K extends string>({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: SortableHeaderProps<K>) {
  const isActive = sortKey === currentKey;
  return (
    <th
      className={cn(
        'cursor-pointer select-none p-3 text-overline font-sans text-(--text-secondary) hover:text-(--text-primary)',
        className,
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive &&
          (currentDir === 'asc' ? (
            <CaretUp className="h-3 w-3" weight="bold" />
          ) : (
            <CaretDown className="h-3 w-3" weight="bold" />
          ))}
      </span>
    </th>
  );
}
