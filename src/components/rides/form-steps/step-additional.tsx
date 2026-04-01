import { GearSix, Check, Prohibit } from '@phosphor-icons/react/dist/ssr';
import { FloatingField } from '@/components/ui/floating-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { RiderAvatar } from '@/components/ui/avatar';
import { StepHeader, PillToggle, OptionalTag } from './shared';
import { appContent } from '@/content/app';
import type { LeaderConflict } from '@/lib/rides/actions';

const { rides: ridesContent, manage: manageContent } = appContent;
const form = ridesContent.form;
const rc = manageContent.recurringRides;

// ---------------------------------------------------------------------------
// Recurring schedule section (private)
// ---------------------------------------------------------------------------

interface RecurringScheduleSectionProps {
  isRecurring: boolean;
  onRecurringChange: (v: boolean) => void;
  recurringEndType: 'never' | 'after' | 'on_date';
  onEndTypeChange: (v: 'never' | 'after' | 'on_date') => void;
  recurringEndDate: string;
  onEndDateChange: (v: string) => void;
  seasonStart?: string;
  seasonEnd?: string;
}

function RecurringScheduleSection({
  isRecurring,
  onRecurringChange,
  recurringEndType,
  onEndTypeChange,
  recurringEndDate,
  onEndDateChange,
  seasonStart,
  seasonEnd,
}: RecurringScheduleSectionProps) {
  return (
    <>
      <PillToggle
        id="is_recurring"
        label={ridesContent.recurring.toggle}
        checked={isRecurring}
        onCheckedChange={onRecurringChange}
      />
      {isRecurring && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloatingField
              label={ridesContent.recurring.frequency}
              htmlFor="recurrence"
              hasValue={true}
            >
              <Select
                name="recurrence"
                defaultValue="weekly"
                items={{
                  weekly: rc.recurrence.weekly,
                  biweekly: rc.recurrence.biweekly,
                  monthly: rc.recurrence.monthly,
                }}
              >
                <SelectTrigger id="recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{rc.recurrence.weekly}</SelectItem>
                  <SelectItem value="biweekly">{rc.recurrence.biweekly}</SelectItem>
                  <SelectItem value="monthly">{rc.recurrence.monthly}</SelectItem>
                </SelectContent>
              </Select>
            </FloatingField>
            <FloatingField
              label={ridesContent.recurring.endCondition}
              htmlFor="recurring_end_type"
              hasValue={true}
            >
              <Select
                name="recurring_end_type"
                value={recurringEndType}
                onValueChange={(v) => onEndTypeChange(v as 'never' | 'after' | 'on_date')}
                items={{
                  never: ridesContent.recurring.endNever,
                  after: ridesContent.recurring.endAfter,
                  on_date: ridesContent.recurring.endOnDate,
                }}
              >
                <SelectTrigger id="recurring_end_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{ridesContent.recurring.endNever}</SelectItem>
                  <SelectItem value="after">{ridesContent.recurring.endAfter}</SelectItem>
                  <SelectItem value="on_date">{ridesContent.recurring.endOnDate}</SelectItem>
                </SelectContent>
              </Select>
            </FloatingField>
          </div>
          {recurringEndType === 'after' && (
            <FloatingField
              label={ridesContent.recurring.occurrences}
              htmlFor="end_after"
              hasValue={true}
            >
              <Input
                id="end_after"
                name="end_after"
                type="number"
                min="1"
                max="52"
                defaultValue="10"
                placeholder=" "
              />
            </FloatingField>
          )}
          {recurringEndType === 'on_date' && (
            <FloatingField
              label={ridesContent.recurring.endOnDate}
              htmlFor="end_date"
              hasValue={!!recurringEndDate}
            >
              <DatePicker
                id="end_date"
                name="end_date"
                value={recurringEndDate}
                onChange={onEndDateChange}
                min={seasonStart || undefined}
                max={seasonEnd || undefined}
              />
            </FloatingField>
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// StepAdditional — co-leaders + recurring schedule
// ---------------------------------------------------------------------------

interface StepAdditionalProps {
  isEdit: boolean;
  eligibleLeaders: { user_id: string; name: string; avatar_url: string | null }[];
  selectedCoLeaders: string[];
  coLeaderConflicts: LeaderConflict[];
  onToggleCoLeader: (userId: string) => void;
  isRecurring: boolean;
  onRecurringChange: (v: boolean) => void;
  recurringEndType: 'never' | 'after' | 'on_date';
  onEndTypeChange: (v: 'never' | 'after' | 'on_date') => void;
  recurringEndDate: string;
  onEndDateChange: (v: string) => void;
  seasonStart?: string;
  seasonEnd?: string;
}

export function StepAdditional({
  isEdit,
  eligibleLeaders,
  selectedCoLeaders,
  coLeaderConflicts,
  onToggleCoLeader,
  isRecurring,
  onRecurringChange,
  recurringEndType,
  onEndTypeChange,
  recurringEndDate,
  onEndDateChange,
  seasonStart,
  seasonEnd,
}: StepAdditionalProps) {
  return (
    <div className="rounded-xl border-0 bg-surface-default p-4">
      <StepHeader heading={form.stepAdditionalHeading} icon={GearSix} />
      <div className="flex flex-col gap-5">
        {/* Co-leader picker (create mode only) */}
        {!isEdit && eligibleLeaders.length > 0 && (
          <div className="space-y-3">
            <Label>
              {form.coLeaders}
              <OptionalTag />
            </Label>
            <div className="flex flex-col gap-1">
              {eligibleLeaders.map((leader) => {
                const isSelected = selectedCoLeaders.includes(leader.user_id);
                const conflict = coLeaderConflicts.find((c) => c.user_id === leader.user_id);
                const hasConflict = !!conflict;
                return (
                  <button
                    key={leader.user_id}
                    type="button"
                    disabled={hasConflict}
                    onClick={() => onToggleCoLeader(leader.user_id)}
                    className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${hasConflict ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/50'}`}
                  >
                    <div className={`relative ${hasConflict ? 'grayscale' : ''}`}>
                      <RiderAvatar
                        avatarUrl={leader.avatar_url}
                        name={leader.name}
                        className={isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                      />
                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-2.5" weight="bold" />
                        </span>
                      )}
                      {hasConflict && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Prohibit className="size-2.5" weight="bold" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className={`text-sm truncate ${isSelected ? 'font-medium text-foreground' : hasConflict ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        {leader.name}
                      </p>
                      {hasConflict && (
                        <p className="text-xs text-muted-foreground truncate">
                          {form.coLeadersUnavailable}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recurring schedule (create-only) */}
        {!isEdit && (
          <RecurringScheduleSection
            isRecurring={isRecurring}
            onRecurringChange={onRecurringChange}
            recurringEndType={recurringEndType}
            onEndTypeChange={onEndTypeChange}
            recurringEndDate={recurringEndDate}
            onEndDateChange={onEndDateChange}
            seasonStart={seasonStart}
            seasonEnd={seasonEnd}
          />
        )}
      </div>
    </div>
  );
}
