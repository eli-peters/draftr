import { redirect } from "next/navigation";
import { format } from "date-fns";
import {
  Plus,
  Users,
  MapPin,
  CaretRight,
  CloudRain,
  EnvelopeSimple,
  DotsThreeOutline,
  Bicycle,
  UsersThree,
  ChartLineUp,
  TrendUp,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getUserClubMembership } from "@/lib/rides/queries";
import { appContent } from "@/content/app";
import type { UserRole } from "@/config/navigation";

const { manage: content } = appContent;

const mockStats = { totalRides: 24, activeMembers: 187, signupsThisWeek: 48, avgRiders: 16 };

const mockUpcomingRides = [
  { id: "1", title: "Saturday Morning Social", ride_date: "2026-03-21", start_time: "07:30", pace_group: "Social", location: "Canary District", signup_count: 18, capacity: 25, status: "scheduled" as const, created_by: "Leo Leader" },
  { id: "2", title: "Humber River Loop", ride_date: "2026-03-22", start_time: "08:00", pace_group: "Intermediate", location: "Spadina & Queens Quay", signup_count: 12, capacity: 20, status: "weather_watch" as const, created_by: "Leo Leader" },
  { id: "8", title: "Tuesday Evening Tempo", ride_date: "2026-03-18", start_time: "18:00", pace_group: "Advanced", location: "East York Civic Centre", signup_count: 8, capacity: 15, status: "scheduled" as const, created_by: "Alex Admin" },
];

const mockMembers = [
  { id: "1", full_name: "Riley Rider", email: "rider@draftr.app", role: "rider" as const, status: "active" as const },
  { id: "2", full_name: "Leo Leader", email: "leader@draftr.app", role: "ride_leader" as const, status: "active" as const },
  { id: "3", full_name: "Alex Admin", email: "admin@draftr.app", role: "admin" as const, status: "active" as const },
  { id: "4", full_name: "Sam Stevens", email: "sam@example.com", role: "rider" as const, status: "active" as const },
  { id: "5", full_name: "Jordan Park", email: "jordan@example.com", role: "rider" as const, status: "pending" as const },
  { id: "6", full_name: "Casey Chen", email: "casey@example.com", role: "ride_leader" as const, status: "active" as const },
];

const statItems = [
  { label: content.stats.totalRides, value: String(mockStats.totalRides), icon: Bicycle },
  { label: content.stats.activeMembers, value: String(mockStats.activeMembers), icon: UsersThree },
  { label: content.stats.signupsThisWeek, value: String(mockStats.signupsThisWeek), icon: ChartLineUp },
  { label: content.stats.avgRiders, value: String(mockStats.avgRiders), icon: TrendUp },
];

function ManageRideItem({ ride }: { ride: (typeof mockUpcomingRides)[0] }) {
  const capacityPercent = (ride.signup_count / ride.capacity) * 100;
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/10 bg-card p-5 pl-7 shadow-sm card-hover mb-3">
      <div className="accent-bar-left" />
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground truncate">{ride.title}</h3>
            {ride.status === "weather_watch" && (
              <Badge variant="outline" className="shrink-0 text-amber-600 border-amber-300 text-sm gap-1">
                <CloudRain weight="fill" className="h-3.5 w-3.5" />Weather Watch
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span>{format(new Date(ride.ride_date), "EEE, MMM d")} at {ride.start_time}</span>
            <span className="flex items-center gap-1.5"><MapPin weight="fill" className="h-3.5 w-3.5" />{ride.location}</span>
            <span className="flex items-center gap-1.5"><Users weight="fill" className="h-3.5 w-3.5" />{ride.signup_count}/{ride.capacity}</span>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground/60">Created by {ride.created_by}</p>
        </div>
        <CaretRight weight="bold" className="ml-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
      </div>
      <div className="mt-4 h-0.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: (typeof mockMembers)[0] }) {
  const initials = member.full_name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="rounded-xl border border-border/10 bg-card p-4 shadow-sm card-hover mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-base font-medium text-foreground">{member.full_name}</p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member.status === "pending" ? (
            <Badge variant="outline" className="text-sm border-amber-300 text-amber-600">{content.members.status.pending}</Badge>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">{content.members.roles[member.role]}</span>
          )}
          <button className="p-1.5 text-muted-foreground/40 hover:text-foreground transition-colors">
            <DotsThreeOutline weight="fill" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default async function ManagePage() {
  const membership = await getUserClubMembership();
  if (!membership) redirect("/sign-in");

  const userRole = membership.role as UserRole;
  const isAdmin = userRole === "admin";

  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10 gradient-crimson">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-foreground">{content.heading}</h1>
        <Button variant="gradient" size="sm">
          <Plus weight="bold" className="mr-1.5 h-4 w-4" />{content.rides.createRide}
        </Button>
      </div>

      {isAdmin && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statItems.map((stat) => (
            <div key={stat.label} className="relative overflow-hidden rounded-xl border border-border/10 bg-card p-5 shadow-sm accent-line-top">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <stat.icon weight="duotone" className="h-5 w-5 text-primary" />
              </div>
              <p className="text-stat text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="rides" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="rides">{content.sections.rides}</TabsTrigger>
          {isAdmin && <TabsTrigger value="members">{content.sections.members}</TabsTrigger>}
        </TabsList>

        <TabsContent value="rides">
          <div className="mt-4">
            <h2 className="text-section">{content.rides.upcoming}</h2>
            {mockUpcomingRides.length === 0 ? (
              <p className="mt-3 text-base text-muted-foreground">{content.rides.noRides}</p>
            ) : (
              <div className="mt-3">
                {mockUpcomingRides.map((ride) => <ManageRideItem key={ride.id} ride={ride} />)}
              </div>
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="members">
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground font-medium">{content.members.totalMembers(mockMembers.length)}</p>
                <Button variant="outline" size="sm">
                  <EnvelopeSimple weight="bold" className="mr-1.5 h-4 w-4" />{content.members.invite}
                </Button>
              </div>
              <div className="mt-3">
                {mockMembers.map((member) => <MemberRow key={member.id} member={member} />)}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
