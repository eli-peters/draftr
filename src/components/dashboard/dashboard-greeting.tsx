import { createClient } from '@/lib/supabase/server';
import { GreetingSection } from './greeting-section';

interface DashboardGreetingProps {
  userId: string;
  className?: string;
}

/**
 * Async server component — resolves the user's first name then hands off to
 * the client-side GreetingSection which applies the time-of-day greeting.
 * Intentionally thin so the Suspense boundary resolves quickly.
 */
export async function DashboardGreeting({ userId, className }: DashboardGreetingProps) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', userId)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  return <GreetingSection firstName={firstName} className={className} />;
}
