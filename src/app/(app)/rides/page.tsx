import { appContent } from "@/content/app";

const { feed } = appContent.rides;

export default function RidesPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-foreground">
        {feed.heading}
      </h1>

      {/* Empty state — will be replaced with ride feed */}
      <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-foreground">
          {feed.emptyState.title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {feed.emptyState.description}
        </p>
      </div>
    </div>
  );
}
