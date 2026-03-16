import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/profile/queries";
import { appContent } from "@/content/app";
import { ProfileEditForm } from "./profile-edit-form";

const { profile: content, auth } = appContent;

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/sign-in");

  const profile = await getUserProfile(authUser.id);
  if (!profile) redirect("/sign-in");

  // Fetch pace groups for the dropdown
  const { data: paceGroups } = await supabase
    .from("pace_groups")
    .select("id, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{content.editButton}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{auth.setupProfile.subheading}</p>

      <ProfileEditForm
        profile={{
          display_name: profile.display_name ?? "",
          bio: profile.bio ?? "",
          preferred_pace_group: profile.preferred_pace_group ?? "",
        }}
        paceGroups={paceGroups ?? []}
      />
    </div>
  );
}
