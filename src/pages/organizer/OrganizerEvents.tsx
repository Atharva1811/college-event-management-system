import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';
import { calculateEventStatus } from '../../utils/eventRules';
import DatePicker from '../../components/form/DatePicker';

export default function OrganizerEvents() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 50 };
      if (currentUser?.role === 'organizer') {
        params.organizer = currentUser._id;
      }
      const data = await eventService.getEvents(params);
      setEvents(data.events);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch events', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, showToast]);

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

  const handleDelete = async (id: string, title: string, status: string) => {
    if (status === 'ongoing') {
      showToast('Ongoing events cannot be deleted.', 'error');
      return;
    }
    if (status === 'completed') {
      showToast('Completed events cannot be deleted.', 'error');
      return;
    }

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

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredEvents = events.filter((ev) => {
    const currentStatus = calculateEventStatus(ev);
    if (statusFilter !== 'All' && currentStatus !== statusFilter) return false;
    if (search && !ev.title.toLowerCase().includes(search.toLowerCase()) && !ev.venue.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    const evDate = new Date(ev.date).toISOString().split('T')[0];
    if (fromDate && evDate < fromDate) return false;
    if (toDate && evDate > toDate) return false;
    return true;
  });

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

      {/* Filter and Date Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search event title or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50/50 dark:bg-gray-900 focus:outline-none dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="All">Status: All</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar with Calendar Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">From Date (Calendar)</label>
            <DatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="Filter from date..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">To Date (Calendar)</label>
            <DatePicker
              value={toDate}
              minDate={fromDate || undefined}
              onChange={(val) => setToDate(val)}
              placeholder="Filter to date..."
            />
          </div>
          {(fromDate || toDate) && (
            <div className="flex items-end pb-1">
              <button
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                }}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer underline"
              >
                Clear Date Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No events found matching current criteria. Click "Create New Event" to get started!
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
                {filteredEvents.map((ev) => {
                  const currentStatus = calculateEventStatus(ev);
                  const isEligibleToEdit = currentStatus === 'upcoming';
                  const canCancel = currentStatus === 'upcoming';
                  const canDelete = currentStatus !== 'ongoing' && currentStatus !== 'completed';

                  return (
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
                            currentStatus === 'upcoming'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : currentStatus === 'ongoing'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : currentStatus === 'completed'
                              ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/student/events/${ev._id}`}
                          className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600"
                        >
                          View
                        </Link>
                        {isEligibleToEdit ? (
                          <Link
                            to={`/organizer/events/${ev._id}/edit`}
                            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            Edit
                          </Link>
                        ) : (
                          <span
                            title="Only upcoming events can be edited"
                            className="text-xs font-semibold text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          >
                            Edit
                          </span>
                        )}
                        <Link
                          to={`/organizer/participants?event=${ev._id}`}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Roster
                        </Link>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(ev._id, ev.title)}
                            disabled={cancellingId === ev._id}
                            className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(ev._id, ev.title, currentStatus)}
                            className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
