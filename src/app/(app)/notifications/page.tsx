import { appContent } from "@/content/app";

const { notifications } = appContent;

export default function NotificationsPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-foreground">
        {notifications.heading}
      </h1>

      <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-lg font-medium text-foreground">
          {notifications.emptyState.title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {notifications.emptyState.description}
        </p>
      </div>
    </div>
  );
}
