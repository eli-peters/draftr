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
const form = ridesContent.form;

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

    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const ride_date = fd.get("ride_date") as string;
    const start_time = fd.get("start_time") as string;

    if (!title || !ride_date || !start_time) {
      setError(form.required);
      setIsPending(false);
      return;
    }

    const shared = {
      title,
      description: (fd.get("description") as string) || undefined,
      ride_date,
      start_time,
      meeting_location_id: (fd.get("meeting_location_id") as string) || undefined,
      pace_group_id: (fd.get("pace_group_id") as string) || undefined,
      distance_km: fd.get("distance_km") ? Number(fd.get("distance_km")) : undefined,
      elevation_m: fd.get("elevation_m") ? Number(fd.get("elevation_m")) : undefined,
      capacity: fd.get("capacity") ? Number(fd.get("capacity")) : undefined,
      route_url: (fd.get("route_url") as string) || undefined,
      route_name: (fd.get("route_name") as string) || undefined,
      is_drop_ride: fd.get("is_drop_ride") === "on",
      organiser_notes: (fd.get("organiser_notes") as string) || undefined,
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
        <Label htmlFor="title">{form.title} *</Label>
        <Input id="title" name="title" required defaultValue={initialData?.title} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ride_date">{form.date} *</Label>
          <Input id="ride_date" name="ride_date" type="date" required defaultValue={initialData?.ride_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">{form.startTime} *</Label>
          <Input id="start_time" name="start_time" type="time" required defaultValue={initialData?.start_time} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting_location_id">{form.meetingLocation}</Label>
          <select id="meeting_location_id" name="meeting_location_id" defaultValue={initialData?.meeting_location_id} className={selectClass}>
            <option value="">{form.selectLocation}</option>
            {meetingLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pace_group_id">{form.paceGroup}</Label>
          <select id="pace_group_id" name="pace_group_id" defaultValue={initialData?.pace_group_id} className={selectClass}>
            <option value="">{form.selectPace}</option>
            {paceGroups.map((pg) => (
              <option key={pg.id} value={pg.id}>{pg.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance_km">{form.distance}</Label>
          <Input id="distance_km" name="distance_km" type="number" step="0.1" min="0" defaultValue={initialData?.distance_km} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="elevation_m">{form.elevation}</Label>
          <Input id="elevation_m" name="elevation_m" type="number" min="0" defaultValue={initialData?.elevation_m} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">{form.capacity}</Label>
          <Input id="capacity" name="capacity" type="number" min="1" defaultValue={initialData?.capacity} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="route_name">{form.routeName}</Label>
          <Input id="route_name" name="route_name" defaultValue={initialData?.route_name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="route_url">{form.routeLink}</Label>
          <Input id="route_url" name="route_url" type="url" defaultValue={initialData?.route_url} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input id="is_drop_ride" name="is_drop_ride" type="checkbox" defaultChecked={initialData?.is_drop_ride} className="h-4 w-4 rounded border-input" />
        <Label htmlFor="is_drop_ride" className="cursor-pointer">{form.isDropRide}</Label>
      </div>

      <div className="space-y-2">
        <Label>{form.tags}</Label>
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
        <Label htmlFor="description">{form.description}</Label>
        <textarea id="description" name="description" rows={2} defaultValue={initialData?.description} placeholder={form.descriptionPlaceholder} className={textareaClass} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organiser_notes">{form.organiserNotes}</Label>
        <textarea id="organiser_notes" name="organiser_notes" rows={2} defaultValue={initialData?.organiser_notes} placeholder={form.organiserNotesPlaceholder} className={textareaClass} />
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
