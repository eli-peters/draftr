"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { appContent } from "@/content/app";
import { createRide, updateRide, type CreateRideData, type UpdateRideData } from "@/lib/rides/actions";

const { rides: ridesContent, common } = appContent;

interface RideFormInitialData {
  title: string;
  description: string;
  ride_date: string;
  start_time: string;
  meeting_location_id: string;
  pace_group_id: string;
  distance_km: string;
  elevation_m: string;
  capacity: string;
  route_name: string;
  route_url: string;
  is_drop_ride: boolean;
  organiser_notes: string;
  tag_ids: string[];
}

interface RideFormProps {
  clubId: string;
  meetingLocations: { id: string; name: string }[];
  paceGroups: { id: string; name: string }[];
  tags: { id: string; name: string; color: string | null }[];
  /** If provided, the form operates in edit mode. */
  rideId?: string;
  initialData?: RideFormInitialData;
}

const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const textareaClass = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function RideForm({ clubId, meetingLocations, paceGroups, tags, rideId, initialData }: RideFormProps) {
  const router = useRouter();
  const isEdit = !!rideId;
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tag_ids ?? []);

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const ride_date = form.get("ride_date") as string;
    const start_time = form.get("start_time") as string;

    if (!title || !ride_date || !start_time) {
      setError("Title, date, and start time are required.");
      setIsPending(false);
      return;
    }

    const shared = {
      title,
      description: (form.get("description") as string) || undefined,
      ride_date,
      start_time,
      meeting_location_id: (form.get("meeting_location_id") as string) || undefined,
      pace_group_id: (form.get("pace_group_id") as string) || undefined,
      distance_km: form.get("distance_km") ? Number(form.get("distance_km")) : undefined,
      elevation_m: form.get("elevation_m") ? Number(form.get("elevation_m")) : undefined,
      capacity: form.get("capacity") ? Number(form.get("capacity")) : undefined,
      route_url: (form.get("route_url") as string) || undefined,
      route_name: (form.get("route_name") as string) || undefined,
      is_drop_ride: form.get("is_drop_ride") === "on",
      organiser_notes: (form.get("organiser_notes") as string) || undefined,
      tag_ids: selectedTags,
    };

    let result: { error?: string; success?: boolean };

    if (isEdit) {
      result = await updateRide(rideId, shared as UpdateRideData);
    } else {
      result = await createRide({ ...shared, club_id: clubId } as CreateRideData);
    }

    setIsPending(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/manage");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required defaultValue={initialData?.title} placeholder="Saturday Morning Social" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ride_date">Date *</Label>
          <Input id="ride_date" name="ride_date" type="date" required defaultValue={initialData?.ride_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start time *</Label>
          <Input id="start_time" name="start_time" type="time" required defaultValue={initialData?.start_time} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting_location_id">Meeting Location</Label>
          <select id="meeting_location_id" name="meeting_location_id" defaultValue={initialData?.meeting_location_id} className={selectClass}>
            <option value="">Select location...</option>
            {meetingLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pace_group_id">Pace Group</Label>
          <select id="pace_group_id" name="pace_group_id" defaultValue={initialData?.pace_group_id} className={selectClass}>
            <option value="">Select pace...</option>
            {paceGroups.map((pg) => (
              <option key={pg.id} value={pg.id}>{pg.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance_km">Distance (km)</Label>
          <Input id="distance_km" name="distance_km" type="number" step="0.1" min="0" defaultValue={initialData?.distance_km} placeholder="65" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="elevation_m">Elevation (m)</Label>
          <Input id="elevation_m" name="elevation_m" type="number" min="0" defaultValue={initialData?.elevation_m} placeholder="380" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" name="capacity" type="number" min="1" defaultValue={initialData?.capacity} placeholder="25" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="route_name">Route Name</Label>
          <Input id="route_name" name="route_name" defaultValue={initialData?.route_name} placeholder="Humber River Loop" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="route_url">Route Link</Label>
          <Input id="route_url" name="route_url" type="url" defaultValue={initialData?.route_url} placeholder="https://strava.com/routes/..." />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input id="is_drop_ride" name="is_drop_ride" type="checkbox" defaultChecked={initialData?.is_drop_ride} className="h-4 w-4 rounded border-input" />
        <Label htmlFor="is_drop_ride" className="cursor-pointer">This is a drop ride</Label>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer text-sm px-3 py-1"
                style={
                  isSelected && tag.color
                    ? { backgroundColor: tag.color, color: "#fff", borderColor: tag.color }
                    : tag.color
                      ? { borderColor: `${tag.color}60`, color: tag.color }
                      : undefined
                }
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea id="description" name="description" rows={2} defaultValue={initialData?.description} placeholder="Brief description of the ride..." className={textareaClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organiser_notes">Organiser Notes</Label>
        <textarea id="organiser_notes" name="organiser_notes" rows={2} defaultValue={initialData?.organiser_notes} placeholder="Notes for riders (meeting point details, things to bring, etc.)..." className={textareaClass} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? common.loading : isEdit ? common.save : ridesContent.create.submitButton}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {common.cancel}
        </Button>
      </div>
    </form>
  );
}
