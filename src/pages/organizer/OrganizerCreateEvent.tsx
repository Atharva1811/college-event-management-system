import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import DatePicker from '../../components/form/DatePicker';
import TimePicker from '../../components/form/TimePicker';
import { formatTimeRange } from '../../utils/dateTimeUtils';
import { EventCategory } from '../../types';

const categories: EventCategory[] = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition',
  'Other',
];

export default function OrganizerCreateEvent() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Workshop');
  const [date, setDate] = useState('2026-11-25');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [venue, setVenue] = useState('Computer Science Seminar Complex');
  const [capacity, setCapacity] = useState('60');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-22');
  const [image, setImage] = useState(
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    // 4. Capacity validation: positive whole number
    const capNum = Number(capacity);
    if (!Number.isInteger(capNum) || capNum <= 0) {
      setError('Capacity must be a positive whole number.');
      return;
    }

    // 5. Date validation
    if (!date) {
      setError('Please select an event date.');
      return;
    }

    const eventDateObj = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDateObj < today) {
      setError('Event date cannot be in the past.');
      return;
    }

    // 6. Time validation
    if (!startTime) {
      setError('Please select a start time.');
      return;
    }
    if (!endTime) {
      setError('Please select an end time.');
      return;
    }

    // 7. Registration deadline validation
    if (!registrationDeadline) {
      setError('Please select a registration deadline.');
      return;
    }

    const deadlineObj = new Date(registrationDeadline);
    if (deadlineObj > eventDateObj) {
      setError('Registration deadline cannot be after the scheduled event date.');
      return;
    }
    if (deadlineObj < today) {
      setError('Registration deadline cannot be in the past.');
      return;
    }

    const combinedTime = formatTimeRange(startTime, endTime);

    setLoading(true);
    try {
      await eventService.createEvent({
        title: title.trim(),
        description: description.trim(),
        category,
        date: new Date(date).toISOString(),
        time: combinedTime,
        venue: venue.trim(),
        capacity: capNum,
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        image: image.trim(),
      });

      showToast(`Event "${title}" published successfully!`, 'success');
      navigate('/organizer/events');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create event.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Create Campus Event
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Fill in the event parameters below using calendar and time pickers.
          </p>
        </div>
        <Link
          to="/organizer/events"
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕ Cancel
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            1. Basic Information
          </h3>

          <div>
            <Label>Event Title <span className="text-error-500">*</span></Label>
            <Input
              type="text"
              placeholder="e.g. Next-Gen Cloud Computing & NoSQL Workshop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Category <span className="text-error-500">*</span></Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="dark:bg-gray-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Target Capacity <span className="text-error-500">*</span></Label>
              <Input
                type="number"
                min="1"
                step={1}
                placeholder="60"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Event Description <span className="text-error-500">*</span></Label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the schedule, speaker background, prerequisites, and learning outcomes..."
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none dark:text-white"
              required
            />
          </div>
        </div>

        {/* Section 2: Schedule & Logistics */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            2. Schedule & Logistics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Event Date <span className="text-error-500">*</span></Label>
              <DatePicker
                id="create-event-date"
                value={date}
                minDate="today"
                placeholder="Select event date"
                onChange={(val) => setDate(val)}
                required
              />
            </div>

            <div>
              <Label>Start Time <span className="text-error-500">*</span></Label>
              <TimePicker
                id="create-event-start-time"
                value={startTime}
                placeholder="Select start time"
                onChange={(val) => setStartTime(val)}
                required
              />
            </div>

            <div>
              <Label>End Time <span className="text-error-500">*</span></Label>
              <TimePicker
                id="create-event-end-time"
                value={endTime}
                placeholder="Select end time"
                onChange={(val) => setEndTime(val)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Campus Venue <span className="text-error-500">*</span></Label>
              <Input
                type="text"
                placeholder="Auditorium Hall A or Lab 4"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Registration Deadline <span className="text-error-500">*</span></Label>
              <DatePicker
                id="create-event-deadline"
                value={registrationDeadline}
                minDate="today"
                maxDate={date || undefined}
                placeholder="Select deadline date"
                onChange={(val) => setRegistrationDeadline(val)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Media */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            3. Media & Poster
          </h3>

          <div>
            <Label>Cover Image URL</Label>
            <Input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          {image && (
            <div className="relative h-40 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                Live Preview
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/organizer/events"
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Link>
          <Button
            className="px-6 py-2.5 text-xs font-bold shadow-lg shadow-brand-500/25"
            disabled={loading}
          >
            {loading ? 'Publishing Event...' : 'Publish Campus Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
