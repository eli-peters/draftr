import { cn } from '@/lib/utils';

interface PolylineSvgProps {
  coords: [number, number][];
  className?: string;
  strokeWidth?: number;
  padding?: number;
  showStartEnd?: boolean;
  closed?: boolean;
  /** CSS color string. Defaults to currentColor so it inherits from text-color. */
  stroke?: string;
}

export function PolylineSvg({
  coords,
  className,
  strokeWidth = 2.5,
  padding = 6,
  showStartEnd = false,
  closed = false,
  stroke = 'currentColor',
}: PolylineSvgProps) {
  if (coords.length < 2) return null;

  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const viewSize = 100;
  const inner = viewSize - padding * 2;
  const scale = Math.min(inner / spanX, inner / spanY);
  const offsetX = padding + (inner - spanX * scale) / 2;
  const offsetY = padding + (inner - spanY * scale) / 2;

  const projected = coords.map(([x, y]) => [
    offsetX + (x - minX) * scale,
    offsetY + (y - minY) * scale,
  ]);

  const path = projected
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const fullPath = closed ? `${path} Z` : path;

  const [startX, startY] = projected[0];
  const [endX, endY] = projected[projected.length - 1];

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      className={cn('block', className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={fullPath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showStartEnd && (
        <>
          <circle cx={startX} cy={startY} r={strokeWidth * 1.4} fill={stroke} />
          {!closed && (
            <circle cx={endX} cy={endY} r={strokeWidth * 1.1} fill={stroke} opacity={0.6} />
          )}
        </>
      )}
    </svg>
  );
}

interface ElevationSvgProps {
  coords: [number, number][];
  className?: string;
  stroke?: string;
  fill?: string;
}

/** Treats the x of each route coord as sample index, y as elevation proxy. */
export function ElevationSvg({
  coords,
  className,
  stroke = 'currentColor',
  fill = 'currentColor',
}: ElevationSvgProps) {
  if (coords.length < 2) return null;
  const width = 100;
  const height = 30;
  const padding = 2;

  const ys = coords.map(([, y]) => y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = maxY - minY || 1;

  const projected = coords.map(([, y], i) => {
    const x = padding + ((width - padding * 2) * i) / (coords.length - 1);
    const normY = padding + (height - padding * 2) - ((y - minY) / span) * (height - padding * 2);
    return [x, normY] as [number, number];
  });

  const linePath = projected
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L${projected[projected.length - 1][0].toFixed(2)},${height - padding} L${projected[0][0].toFixed(2)},${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block', className)}
      aria-hidden
      preserveAspectRatio="none"
    >
      <path d={areaPath} fill={fill} opacity={0.18} />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
