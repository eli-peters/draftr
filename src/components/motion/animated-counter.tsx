interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className,
}: AnimatedCounterProps) {
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
