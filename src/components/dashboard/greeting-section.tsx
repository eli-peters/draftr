'use client';

import { useState, useEffect } from 'react';
import { appContent } from '@/content/app';

const { dashboard } = appContent;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return dashboard.greeting.morning;
  if (hour < 18) return dashboard.greeting.afternoon;
  return dashboard.greeting.evening;
}

interface GreetingSectionProps {
  firstName: string;
  subtitle?: string;
}

export function GreetingSection({ firstName, subtitle }: GreetingSectionProps) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(dashboard.greetingWithName(getGreeting(), firstName));
  }, [firstName]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{greeting || '\u00A0'}</h1>
      {subtitle && <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
