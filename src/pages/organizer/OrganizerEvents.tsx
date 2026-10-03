import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import { Event } from '../../types';

export default function OrganizerEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents({ limit: 50 });
      setEvents(data.events);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch events', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCancel = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to cancel "${title}"?`)) return;
    setCancellingId(id);
    try {
      await eventService.cancelEvent(id);
      showToast(`Event "${title}" marked as cancelled.`, 'info');
      await loadEvents();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel event', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${title}" and all its registration records? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await eventService.deleteEvent(id);
      showToast(`Event "${title}" deleted successfully.`, 'success');
      await loadEvents();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete event', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            My Organized Events
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your schedule, update venue and capacity, review participants, and track attendance.
          </p>
        </div>
        <Link
          to="/organizer/events/create"
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors text-center"
        >
          + Create New Event
        </Link>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No events found. Click "Create New Event" to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Capacity & Registrations</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {events.map((ev) => (
                  <tr key={ev._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                      {ev.title}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {ev.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                      <div>{new Date(ev.date).toLocaleDateString()}</div>
                      <div className="text-gray-400">{ev.time}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                      {ev.venue}
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {ev.registeredCount || 0}
                      </span>{' '}
                      / {ev.capacity} seats
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-md ${
                          ev.status === 'upcoming'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : ev.status === 'completed'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/student/events/${ev._id}`}
                        className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600"
                      >
                        View
                      </Link>
                      <Link
                        to={`/organizer/events/${ev._id}/edit`}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/organizer/participants?event=${ev._id}`}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Roster
                      </Link>
                      {ev.status === 'upcoming' && (
                        <button
                          onClick={() => handleCancel(ev._id, ev.title)}
                          disabled={cancellingId === ev._id}
                          className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(ev._id, ev.title)}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
