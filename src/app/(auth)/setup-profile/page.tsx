import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileSetupForm } from "@/components/auth/profile-setup-form";
import { appContent } from "@/content/app";

const { setupProfile } = appContent.auth;

export default async function SetupProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{setupProfile.heading}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{setupProfile.subheading}</p>
      </div>
      <ProfileSetupForm userEmail={user.email ?? ""} />
    </div>
  );
}
