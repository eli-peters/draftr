interface GreetingSectionProps {
  greeting: string;
  subtitle: string;
}

export function GreetingSection({ greeting, subtitle }: GreetingSectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{greeting}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
