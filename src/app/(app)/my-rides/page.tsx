"use client";

import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  MapPin,
  Path,
  Users,
  CaretRight,
  Bicycle,
  ClockCountdown,
  Queue,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { appContent } from "@/content/app";

const { myRides } = appContent;

const mockUpcomingRides = [
  { id: "1", title: "Saturday Morning Social", ride_date: "2026-03-21", start_time: "07:30", pace_group: "Social (22–26 km/h)", location: "Canary District", distance_km: 45, signup_count: 18, capacity: 25, signed_up_at: "2026-03-14" },
  { id: "2", title: "Humber River Loop", ride_date: "2026-03-22", start_time: "08:00", pace_group: "Intermediate (28–31 km/h)", location: "Spadina & Queens Quay", distance_km: 65, signup_count: 12, capacity: 20, signed_up_at: "2026-03-15" },
];

const mockPastRides = [
  { id: "3", title: "Don Valley Explorer", ride_date: "2026-03-08", start_time: "07:00", pace_group: "Moderate (26–28 km/h)", location: "East York Civic Centre", distance_km: 55, signup_count: 22, capacity: 25 },
  { id: "4", title: "Lakeshore Cruise", ride_date: "2026-03-01", start_time: "08:00", pace_group: "Social (22–26 km/h)", location: "Canary District", distance_km: 40, signup_count: 20, capacity: 30 },
];

const mockWaitlisted = [
  { id: "5", title: "High Park Hills", ride_date: "2026-03-23", start_time: "07:00", pace_group: "Advanced (31–34 km/h)", location: "High Park Pavilion", distance_km: 80, signup_count: 20, capacity: 20, waitlist_position: 2 },
];

interface RideListItemData {
  id: string; title: string; ride_date: string; start_time: string; pace_group: string;
  location: string; distance_km: number; signup_count: number; capacity: number;
  signed_up_at?: string; waitlist_position?: number;
}

const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

function RideListItem({ ride, variant = "upcoming" }: { ride: RideListItemData; variant?: "upcoming" | "past" | "waitlisted" }) {
  const isPast = variant === "past";
  const isWaitlisted = variant === "waitlisted";

  return (
    <motion.div variants={listItemVariants}>
      <Link href={`/rides/${ride.id}`} className="group block">
        <div className={`relative overflow-hidden rounded-xl border border-border/10 bg-card p-5 pl-7 shadow-sm press-scale card-hover mb-3 ${isPast ? "opacity-40" : ""}`}>
          <div className="accent-bar-left" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground truncate">{ride.title}</h3>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {isWaitlisted && ride.waitlist_position && (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-sm">
                  {myRides.waitlistPosition(ride.waitlist_position)}
                </Badge>
              )}
              <CaretRight weight="bold" className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(ride.ride_date), "EEE, MMM d")} · {ride.pace_group}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin weight="fill" className="h-3.5 w-3.5" />{ride.location}</span>
            <span className="flex items-center gap-1.5 text-info"><Path weight="bold" className="h-3.5 w-3.5" />{ride.distance_km} km</span>
            <span className="flex items-center gap-1.5"><Users weight="fill" className="h-3.5 w-3.5" />{ride.signup_count}/{ride.capacity}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyState({ title, description, cta, icon: Icon }: {
  title: string; description: string; cta?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any>;
}) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center py-8">
      {Icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
          <Icon weight="duotone" className="h-10 w-10 text-primary/60" />
        </div>
      )}
      <p className={`${Icon ? "mt-4" : ""} text-lg font-semibold text-foreground`}>{title}</p>
      <p className="mt-2 text-base text-muted-foreground max-w-80">{description}</p>
      {cta && (
        <Link href="/rides" className="mt-4">
          <Button variant="gradient" size="sm">{cta}</Button>
        </Link>
      )}
    </div>
  );
}

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export default function MyRidesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10 gradient-crimson"
    >
      <h1 className="text-display text-foreground">{myRides.heading}</h1>

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming">{myRides.tabs.upcoming}</TabsTrigger>
          <TabsTrigger value="past">{myRides.tabs.past}</TabsTrigger>
          <TabsTrigger value="waitlisted">{myRides.tabs.waitlisted}</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {mockUpcomingRides.length === 0 ? (
            <EmptyState title={myRides.emptyState.upcoming.title} description={myRides.emptyState.upcoming.description} cta={myRides.emptyState.upcoming.cta} icon={Bicycle} />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-4">
              {mockUpcomingRides.map((ride) => <RideListItem key={ride.id} ride={ride} variant="upcoming" />)}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {mockPastRides.length === 0 ? (
            <EmptyState title={myRides.emptyState.past.title} description={myRides.emptyState.past.description} icon={ClockCountdown} />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-4">
              {mockPastRides.map((ride) => <RideListItem key={ride.id} ride={ride} variant="past" />)}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="waitlisted">
          {mockWaitlisted.length === 0 ? (
            <EmptyState title={myRides.emptyState.waitlisted.title} description={myRides.emptyState.waitlisted.description} icon={Queue} />
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-4">
              {mockWaitlisted.map((ride) => <RideListItem key={ride.id} ride={ride} variant="waitlisted" />)}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
