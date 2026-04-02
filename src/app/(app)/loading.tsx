import { ContentCard } from '@/components/ui/content-card';

export default function AppLoading() {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10 animate-pulse">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
      </div>

      {/* Action bar skeleton */}
      <div className="mt-8 space-y-3">
        <ContentCard padding="none" className="h-24" />
      </div>

      {/* Feed skeleton */}
      <div className="mt-10 space-y-4">
        <div className="h-3 w-28 rounded bg-muted mb-4" />
        <ContentCard padding="none" className="h-40" />
        <ContentCard padding="none" className="h-40" />
        <ContentCard padding="none" className="h-40" />
      </div>
    </div>
  );
}
