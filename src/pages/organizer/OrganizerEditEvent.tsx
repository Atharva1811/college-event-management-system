import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
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
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState('');
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
      setTime(ev.time);
      setVenue(ev.venue);
      setCapacity(String(ev.capacity));
      setStatus(ev.status);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);

    setSaving(true);
    try {
      await eventService.updateEvent(id, {
        title,
        description,
        category,
        date: new Date(date).toISOString(),
        time,
        venue,
        capacity: Number(capacity),
        status,
        registrationDeadline: new Date(registrationDeadline).toISOString(),
        image,
      });

      showToast(`Event "${title}" updated successfully!`, 'success');
      navigate('/organizer/events');
    } catch (err: any) {
      setError(err.message || 'Update failed.');
      showToast(err.message || 'Update failed', 'error');
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
            Update schedule, location, capacity, or status.
          </p>
        </div>
        <Link
          to="/organizer/events"
          className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Return to Events
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
          <div>
            <Label>Event Title</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="dark:bg-gray-800">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Capacity</Label>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Event Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="upcoming" className="dark:bg-gray-800">Upcoming</option>
                <option value="ongoing" className="dark:bg-gray-800">Ongoing</option>
                <option value="completed" className="dark:bg-gray-800">Completed</option>
                <option value="cancelled" className="dark:bg-gray-800">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Event Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Time</Label>
              <Input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Venue</Label>
              <Input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Registration Deadline</Label>
              <Input
                type="date"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Cover Image URL</Label>
            <Input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/organizer/events"
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            Cancel
          </Link>
          <Button
            className="px-6 py-2.5 text-xs font-bold"
            disabled={saving}
          >
            {saving ? 'Saving Changes...' : 'Save Modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
