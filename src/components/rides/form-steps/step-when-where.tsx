import { CalendarDots, MapPin, PencilSimple } from '@phosphor-icons/react/dist/ssr';
import { ContentCard } from '@/components/ui/content-card';
import { FloatingField } from '@/components/ui/floating-field';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import { Button } from '@/components/ui/button';
import { LocationMapLoader } from '@/components/rides/location-map-loader';
import { SectionHeading } from '@/components/ui/section-heading';
import { appContent } from '@/content/app';
import type { MeetingLocation } from '@/types/rides';

const form = appContent.rides.form;

interface StepWhenWhereProps {
  rideDate: string;
  startTime: string;
  startLocationName: string;
  startLocationAddress: string;
  startLatitude: number | null;
  startLongitude: number | null;
  isGeocodingLocation: boolean;
  routeUrl: string;
  dateMin: string;
  dateMax?: string;
  meetingLocations: MeetingLocation[];
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onOpenLocationPicker: () => void;
  onSelectSavedLocation: (location: MeetingLocation) => void;
}

export function StepWhenWhere({
  rideDate,
  startTime,
  startLocationName,
  startLocationAddress,
  startLatitude,
  startLongitude,
  isGeocodingLocation,
  routeUrl,
  dateMin,
  dateMax,
  meetingLocations,
  onDateChange,
  onTimeChange,
  onOpenLocationPicker,
  onSelectSavedLocation,
}: StepWhenWhereProps) {
  return (
    <div>
      <SectionHeading as="h3" icon={CalendarDots}>
        {form.sectionWhenWhere}
      </SectionHeading>
      <ContentCard padding="default" className="mt-3">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingField label={form.date} htmlFor="ride_date" hasValue={!!rideDate}>
              <DatePicker
                id="ride_date"
                name="ride_date"
                value={rideDate}
                onChange={onDateChange}
                min={dateMin}
                max={dateMax}
                required
              />
            </FloatingField>
            <FloatingField label={form.startTime} htmlFor="start_time" hasValue={!!startTime}>
              <TimePicker
                id="start_time"
                name="start_time"
                value={startTime}
                onChange={onTimeChange}
                required
              />
            </FloatingField>
          </div>

          {/* Start Location */}
          {isGeocodingLocation ? (
            <p className="text-[0.8125rem] text-muted-foreground">{form.startLocationFromRoute}</p>
          ) : startLocationName ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <MapPin className="size-5 shrink-0 mt-0.5 text-primary" weight="duotone" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {startLocationName}
                    </p>
                    {startLocationAddress && (
                      <p className="text-[0.8125rem] text-muted-foreground truncate mt-0.5">
                        {startLocationAddress}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onOpenLocationPicker}
                  className="shrink-0 rounded-full text-muted-foreground transition-transform hover:bg-action-primary-subtle-bg hover:text-primary active:scale-90"
                >
                  <PencilSimple className="size-5" />
                </Button>
              </div>
              {startLatitude && startLongitude && (
                <LocationMapLoader latitude={startLatitude} longitude={startLongitude} />
              )}
              {/* Saved locations below map — tap to switch */}
              <SavedLocationPills
                locations={meetingLocations}
                activeLocationName={startLocationName}
                onSelect={onSelectSavedLocation}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Saved club locations quick-select */}
              <SavedLocationPills
                locations={meetingLocations}
                activeLocationName={null}
                onSelect={onSelectSavedLocation}
              />
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="w-full rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center gap-2 text-center hover:bg-muted/20 transition-colors"
              >
                <MapPin className="size-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {routeUrl ? form.startLocationManualHint : form.startLocationHint}
                </p>
              </button>
            </div>
          )}
        </div>
      </ContentCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saved location pills — horizontally scrollable, with active state
// ---------------------------------------------------------------------------

function SavedLocationPills({
  locations,
  activeLocationName,
  onSelect,
}: {
  locations: MeetingLocation[];
  activeLocationName: string | null;
  onSelect: (location: MeetingLocation) => void;
}) {
  if (locations.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {form.locationPickerSavedHeading}
      </p>
      <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-1">
        {locations.map((loc) => {
          const isActive = activeLocationName === loc.name;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => onSelect(loc)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-foreground hover:bg-muted'
              }`}
            >
              <MapPin className="size-3.5" weight={isActive ? 'fill' : 'regular'} />
              {loc.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
