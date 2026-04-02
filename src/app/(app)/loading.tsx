import { ContentCard } from '@/components/ui/content-card';

export default function AppLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-4 pt-8 pb-12 md:px-6 md:pt-10 md:pb-16 animate-pulse">
      {/* Greeting skeleton — matches PageHeader centered layout */}
      <div className="relative mb-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-3">
            <div className="h-9 w-56 rounded-lg bg-muted" />
          </div>
        </div>
      </div>

      {/* Weather widget skeleton */}
      <div>
        <ContentCard padding="none" className="h-16" />
      </div>

      {/* Action bar skeleton */}
      <div className="mt-8 space-y-3">
        <ContentCard padding="none" className="h-24" />
      </div>
    </div>
  );
}
