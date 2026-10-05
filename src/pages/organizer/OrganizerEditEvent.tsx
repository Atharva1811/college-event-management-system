import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import DatePicker from '../../components/form/DatePicker';
import TimePicker from '../../components/form/TimePicker';
import LocationSelector from '../../components/events/LocationSelector';
import { parseTimeRange, formatTimeRange } from '../../utils/dateTimeUtils';
import { calculateEventStatus } from '../../utils/eventRules';
import { EventCategory, EventStatus } from '../../types';

const categories: EventCategory[] = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition',
  'Other',
];

export default function OrganizerEditEvent() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshop');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [locationId, setLocationId] = useState('');
  const [locationCapacity, setLocationCapacity] = useState<number>(0);
  const [capacity, setCapacity] = useState('');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [status, setStatus] = useState<EventStatus>('upcoming');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ev = await eventService.getEventById(id);
      setTitle(ev.title);
      setDescription(ev.description);
      setCategory(ev.category);
      setDate(ev.date ? ev.date.substring(0, 10) : '');

      const parsedTimes = parseTimeRange(ev.time);
      setStartTime(parsedTimes.startTime || '10:00 AM');
      setEndTime(parsedTimes.endTime || '04:00 PM');

      setVenue(ev.venue);
      const locId = typeof ev.location === 'object' && ev.location ? ev.location._id : ((ev.location as string) || '');
      setLocationId(locId);
      if (typeof ev.location === 'object' && ev.location?.capacity) {
        setLocationCapacity(ev.location.capacity);
      }
      setCapacity(String(ev.capacity));
      setRegisteredCount(ev.registeredCount || 0);

      // Determine authoritative automatic status
      const autoStatus = calculateEventStatus(ev);
      setStatus(autoStatus);

      setRegistrationDeadline(
        ev.registrationDeadline ? ev.registrationDeadline.substring(0, 10) : ''
      );
      setImage(ev.image || '');
    } catch (err: any) {
      showToast(err.message || 'Failed to load event', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Enforcement: Only upcoming events can be edited
  const isEditable = status === 'upcoming';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);

    if (!isEditable) {
      setError(`Cannot update event: Event is currently ${status}.`);
      return;
    }

    // 1. Title validation
    if (title.trim().length < 3) {
      setError('Event title must be at least 3 characters long.');
      return;
    }
    if (title.trim().length > 150) {
      setError('Event title cannot exceed 150 characters.');
      return;
    }

    // 2. Description validation
    if (description.trim().length < 10) {
      setError('Event description must be at least 10 characters long.');
      return;
    }

    // 3. Venue validation
    if (venue.trim().length < 2) {
      setError('Venue must be at least 2 characters long.');
      return;
    }

    // 4. Capacity validation: positive whole number & cannot be reduced below registered students
    const capNum = Number(capacity);
    if (!Number.isInteger(capNum) || capNum <= 0) {
      setError('Capacity must be a positive whole number.');
      return;
    }

    if (capNum < registeredCount) {
      setError(
        `Capacity cannot be reduced below the current number of registered students (${registeredCount} registered).`
      );
      return;
    }

    // 5. Date validation
    if (!date) {
      setError('Please select an event date.');
      return;
    }

    // 6. Time validation
    if (!startTime || !endTime) {
      setError('Please provide both start time and end time.');
      return;
    }

    // 7. Registration deadline validation
    if (registrationDeadline && date && new Date(registrationDeadline) > new Date(date)) {
      setError('Registration deadline cannot be after the event date.');
      return;
    }

    if (locationCapacity > 0 && capNum > locationCapacity) {
      setError(`Target event capacity (${capNum}) cannot exceed the approved location capacity (${locationCapacity} seats).`);
      return;
    }

    const combinedTime = formatTimeRange(startTime, endTime);

    setSaving(true);
    try {
      await eventService.updateEvent(id, {
        title: title.trim(),
        description: description.trim(),
        category,
        date: new Date(date).toISOString(),
        time: combinedTime,
        venue: venue.trim(),
        location: locationId || undefined,
        capacity: capNum,
        status,
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : new Date(date).toISOString(),
        image: image.trim(),
      });

      showToast(`Event "${title}" updated successfully!`, 'success');
      navigate('/organizer/events');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Update failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Edit Event Parameters
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update schedule, location, capacity, or details using calendar and clock pickers.
          </p>
        </div>
        <Link
          to="/organizer/events"
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Return to Events
        </Link>
      </div>

      {!isEditable && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            This event is currently <strong>{status.toUpperCase()}</strong>. In accordance with university policy, only upcoming events can be modified.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
          <div>
            <Label>Event Title <span className="text-error-500">*</span></Label>
            <Input
              type="text"
              value={title}
              disabled={!isEditable}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Category <span className="text-error-500">*</span></Label>
              <select
                value={category}
                disabled={!isEditable}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="dark:bg-gray-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>
                Capacity <span className="text-error-500">*</span>
                {registeredCount > 0 && (
                  <span className="text-[11px] text-brand-600 ml-1">
                    (min {registeredCount} enrolled)
                  </span>
                )}
              </Label>
              <Input
                type="number"
                min={String(registeredCount > 0 ? registeredCount : 1)}
                step={1}
                value={capacity}
                disabled={!isEditable}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Current Event Status</Label>
              <div className="h-11 flex items-center px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-semibold capitalize text-gray-700 dark:text-gray-300">
                <span
                  className={`inline-block size-2 rounded-full mr-2 ${
                    status === 'upcoming'
                      ? 'bg-emerald-500'
                      : status === 'ongoing'
                      ? 'bg-amber-500'
                      : status === 'completed'
                      ? 'bg-gray-400'
                      : 'bg-rose-500'
                  }`}
                />
                {status} (Auto-calculated)
              </div>
            </div>
          </div>

          <div>
            <Label>Description <span className="text-error-500">*</span></Label>
            <textarea
              rows={4}
              value={description}
              disabled={!isEditable}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none dark:text-white disabled:opacity-50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Event Date <span className="text-error-500">*</span></Label>
              <DatePicker
                id="edit-event-date"
                value={date}
                disabled={!isEditable}
                placeholder="Select date"
                onChange={(val) => setDate(val)}
                required
              />
            </div>

            <div>
              <Label>Start Time <span className="text-error-500">*</span></Label>
              <TimePicker
                id="edit-event-start-time"
                value={startTime}
                disabled={!isEditable}
                placeholder="Start time"
                onChange={(val) => setStartTime(val)}
                required
              />
            </div>

            <div>
              <Label>End Time <span className="text-error-500">*</span></Label>
              <TimePicker
                id="edit-event-end-time"
                value={endTime}
                disabled={!isEditable}
                placeholder="End time"
                onChange={(val) => setEndTime(val)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <LocationSelector
                value={locationId}
                venueText={venue}
                disabled={!isEditable}
                eventCapacity={capacity}
                onChange={(locId, venueStr, locCap) => {
                  setLocationId(locId);
                  setVenue(venueStr);
                  setLocationCapacity(locCap);
                }}
              />
            </div>

            <div>
              <Label>Registration Deadline <span className="text-error-500">*</span></Label>
              <DatePicker
                id="edit-event-deadline"
                value={registrationDeadline}
                disabled={!isEditable}
                maxDate={date || undefined}
                placeholder="Registration deadline"
                onChange={(val) => setRegistrationDeadline(val)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Cover Image URL</Label>
            <Input
              type="url"
              value={image}
              disabled={!isEditable}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/organizer/events"
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
          <Button
            className="px-6 py-2.5 text-xs font-bold"
            disabled={saving || !isEditable}
          >
            {saving ? 'Saving Changes...' : 'Save Modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
