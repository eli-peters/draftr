"use client";

import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bicycle,
  Path,
  CaretRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AnimatedCounter } from "@/components/motion/animated-counter";
import { appContent } from "@/content/app";

const { profile: content } = appContent;

const mockUser = {
  full_name: "Alex Admin",
  display_name: "Alex",
  email: "admin@draftr.app",
  avatar_url: null as string | null,
  bio: "Weekend warrior and coffee-stop enthusiast. Usually found at the back of the pack enjoying the view.",
  preferred_pace_group: "Social (22–26 km/h)",
  role: "admin" as const,
  joined_at: "2024-06-15",
};

const mockRecentRides = [
  { id: "3", title: "Don Valley Explorer", ride_date: "2026-03-08", distance_km: 55 },
  { id: "4", title: "Lakeshore Cruise", ride_date: "2026-03-01", distance_km: 40 },
  { id: "6", title: "Scarborough Bluffs Ride", ride_date: "2026-02-22", distance_km: 60 },
];

const profileStats = [
  { label: content.stats.totalRides, value: 47 },
  { label: content.stats.distance, value: 2.8, suffix: "k", decimals: 1 },
  { label: content.stats.elevation, value: 18.5, suffix: "k", decimals: 1 },
  { label: content.sections.memberSince, value: 0, display: "Jun '24" },
];

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function ProfilePage() {
  const initials = mockUser.full_name.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show"
      className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10 gradient-crimson">

      {/* Hero: Centered avatar */}
      <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 ring-2 ring-primary/20 glow-primary-sm">
          {mockUser.avatar_url && <AvatarImage src={mockUser.avatar_url} alt={mockUser.full_name} />}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
        </Avatar>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {mockUser.display_name ?? mockUser.full_name}
        </h1>
        <p className="text-base text-muted-foreground">{mockUser.email}</p>
        <Badge variant="default" className="mt-2">{content.roles[mockUser.role]}</Badge>
        <Button variant="outline" size="sm" className="mt-4">{content.editButton}</Button>
      </motion.div>

      {/* Stat Strip */}
      <motion.div variants={itemVariants} className="mt-8 rounded-xl border border-border/10 bg-card p-5 shadow-sm">
        <div className="grid grid-cols-4 divide-x divide-border/10">
          {profileStats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-2">
              {stat.display ? (
                <span className="text-stat-sm text-foreground">{stat.display}</span>
              ) : (
                <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals}
                  className="text-stat-sm text-foreground" />
              )}
              <p className="text-sm font-medium text-muted-foreground mt-1.5 text-center">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* About */}
      <motion.div variants={itemVariants} className="mt-8">
        <h2 className="text-section">{content.sections.about}</h2>
        {mockUser.bio ? (
          <p className="mt-3 text-base text-foreground/75 leading-relaxed">{mockUser.bio}</p>
        ) : (
          <p className="mt-3 text-base text-muted-foreground italic">No bio yet</p>
        )}
      </motion.div>

      {/* Preferences */}
      <motion.div variants={itemVariants} className="mt-8">
        <h2 className="text-section">{content.sections.preferences}</h2>
        <div className="mt-3 space-y-2">
          {mockUser.preferred_pace_group && (
            <div className="flex items-center gap-3 rounded-xl border border-border/10 bg-card p-5 card-hover">
              <Bicycle weight="duotone" className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{content.sections.paceGroup}</p>
                <p className="font-medium text-foreground text-base">{mockUser.preferred_pace_group}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Rides */}
      <motion.div variants={itemVariants} className="mt-8">
        <h2 className="text-section">{content.recentRides}</h2>
        {mockRecentRides.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">{content.noRidesYet}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {mockRecentRides.map((ride) => (
              <Link key={ride.id} href={`/rides/${ride.id}`} className="block group">
                <div className="flex items-center justify-between rounded-lg border border-border/5 bg-card/50 p-4 press-scale card-hover">
                  <div className="min-w-0">
                    <p className="text-base font-medium text-foreground truncate">{ride.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>{format(new Date(ride.ride_date), "MMM d")}</span>
                      <span className="flex items-center gap-1 text-info">
                        <Path weight="bold" className="h-3.5 w-3.5" />{ride.distance_km} km
                      </span>
                    </div>
                  </div>
                  <CaretRight weight="bold" className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
