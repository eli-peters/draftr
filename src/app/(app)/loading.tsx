import { SkeletonGroup } from '@/components/motion/skeleton-group';

export default function AppLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden px-4 pt-8 pb-12 md:px-6 md:pt-10 md:pb-16">
      <SkeletonGroup>
        {/* Greeting skeleton — matches PageHeader */}
        <div className="relative mb-8">
          <div className="h-9 w-56 skeleton-shimmer" />
        </div>

        {/* Weather widget skeleton */}
        <div>
          <div className="h-16 skeleton-shimmer rounded-(--card-radius)" />
        </div>

        {/* Action bar skeleton */}
        <div className="mt-8 space-y-3">
          <div className="h-24 skeleton-shimmer rounded-(--card-radius)" />
        </div>
      </SkeletonGroup>
    </div>
  );
}
