import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../context/ToastContext';
import { Registration } from '../../types';

export default function StudentRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await registrationService.getMyRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleCancel = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to cancel registration for "${title}"?`)) {
      return;
    }

    setCancellingId(id);
    try {
      await registrationService.cancelRegistration(id);
      showToast('Registration cancelled. History retained in MongoDB.', 'info');
      await loadRegistrations();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            My Event Registrations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your campus event admissions, verify attendance, and share feedback.
          </p>
        </div>
        <Link
          to="/student/events"
          className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow hover:bg-brand-600 transition-colors text-center"
        >
          + Register New Event
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs text-gray-400">Loading your registrations...</span>
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🎟️</div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              No Registrations Found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              You haven't signed up for any events yet. Check out the latest campus offerings!
            </p>
            <Link
              to="/student/events"
              className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold"
            >
              Browse Event Catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Venue</th>
                  <th className="py-3.5 px-4">Registration Status</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4">Enrolled At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {registrations.map((reg) => {
                  const ev = typeof reg.event === 'object' ? reg.event : null;
                  const isCompleted = ev?.status === 'completed';
                  const isRegistered = reg.status === 'registered';

                  return (
                    <tr
                      key={reg._id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-white">
                        <div>{ev?.title || 'Unknown Event'}</div>
                        <span className="text-[11px] font-normal text-brand-600 dark:text-brand-400">
                          {ev?.category}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {ev ? (
                          <>
                            <div>{new Date(ev.date).toLocaleDateString()}</div>
                            <div className="text-gray-400">{ev.time}</div>
                          </>
                        ) : (
                          '--'
                        )}
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {ev?.venue || '--'}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-md ${
                            reg.status === 'registered'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-md ${
                            reg.attendance === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : reg.attendance === 'absent'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {reg.attendance}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {ev && (
                          <Link
                            to={`/student/events/${ev._id}`}
                            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            View
                          </Link>
                        )}

                        {isRegistered && ev?.status === 'upcoming' && (
                          <button
                            onClick={() => handleCancel(reg._id, ev.title)}
                            disabled={cancellingId === reg._id}
                            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {cancellingId === reg._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}

                        {isCompleted && reg.attendance === 'present' && (
                          <Link
                            to="/student/feedback"
                            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            {reg.rating ? 'Review ★' : 'Leave Feedback'}
                          </Link>
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
