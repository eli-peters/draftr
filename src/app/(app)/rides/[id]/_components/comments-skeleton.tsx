import { ChatCircle } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { appContent } from '@/content/app';

const content = appContent.rides.comments;

export function CommentsSkeleton() {
  return (
    <ContentCard heading={content.heading} icon={ChatCircle}>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="size-8 shrink-0 skeleton-shimmer rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 skeleton-shimmer" />
              <div className="h-3 w-full skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </ContentCard>
  );
}
