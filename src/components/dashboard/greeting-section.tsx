'use client';

import { useState, useEffect } from 'react';
import { appContent } from '@/content/app';

const { dashboard } = appContent;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return dashboard.greeting.night;
  if (hour < 12) return dashboard.greeting.morning;
  if (hour < 17) return dashboard.greeting.afternoon;
  if (hour < 21) return dashboard.greeting.evening;
  return dashboard.greeting.night;
}

interface GreetingSectionProps {
  firstName: string;
}

export function GreetingSection({ firstName }: GreetingSectionProps) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(dashboard.greetingWithName(getGreeting(), firstName));
  }, [firstName]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{greeting || '\u00A0'}</h1>
    </div>
  );
}
