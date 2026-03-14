import { appContent } from "@/content/app";

export default function ProfilePage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-6 md:px-8">
      <h1 className="text-2xl font-bold text-foreground">
        {appContent.profile.heading}
      </h1>
    </div>
  );
}
