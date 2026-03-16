import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { appContent } from "@/content/app";

const { rides: ridesContent } = appContent;

interface SignupEntry {
  id: string;
  status: string;
  signed_up_at: string | null;
  waitlist_position: number | null;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
}

interface SignupRosterProps {
  signups: SignupEntry[];
}

export function SignupRoster({ signups }: SignupRosterProps) {
  if (signups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">{ridesContent.roster.noSignups}</p>
    );
  }

  const confirmed = signups.filter((s) => s.status === "confirmed" || s.status === "checked_in");
  const waitlisted = signups.filter((s) => s.status === "waitlisted");

  return (
    <div className="space-y-1">
      {confirmed.map((signup) => (
        <SignupRow key={signup.id} signup={signup} />
      ))}
      {waitlisted.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-3 pb-1">{ridesContent.roster.waitlisted}</p>
          {waitlisted.map((signup) => (
            <SignupRow key={signup.id} signup={signup} />
          ))}
        </>
      )}
    </div>
  );
}

function SignupRow({ signup }: { signup: SignupEntry }) {
  const initials = signup.user_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{signup.user_name}</p>
        {signup.signed_up_at && (
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(signup.signed_up_at), { addSuffix: true })}
          </p>
        )}
      </div>
      {signup.status === "waitlisted" && signup.waitlist_position != null && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
          #{signup.waitlist_position}
        </Badge>
      )}
    </div>
  );
}
