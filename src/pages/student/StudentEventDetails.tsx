import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../context/ToastContext';
import { Event, Registration } from '../../types';

export default function StudentEventDetails() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRegistration, setUserRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ev, myRegs] = await Promise.all([
        eventService.getEventById(id),
        registrationService.getMyRegistrations(),
      ]);
      setEvent(ev);

      const foundReg = myRegs.find((r) => {
        const eId = typeof r.event === 'object' ? r.event._id : r.event;
        return eId === id && r.status === 'registered';
      });
      setUserRegistration(foundReg || null);
    } catch (err: any) {
      showToast(err.message || 'Failed to load event details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRegister = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await registrationService.registerForEvent(id);
      showToast('Registration successful! See you at the event.', 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;

    setActionLoading(true);
    try {
      await registrationService.cancelRegistration(userRegistration._id);
      showToast('Registration cancelled. Your record is archived.', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Cancellation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event Not Found</h2>
        <Link to="/student/events" className="mt-4 inline-block text-brand-600 font-semibold text-sm">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const isExpired = new Date() > new Date(event.registrationDeadline);
  const orgName = typeof event.organizer === 'object' ? event.organizer.name : 'Faculty Staff';
  const orgDept = typeof event.organizer === 'object' ? event.organizer.department : 'College';

  // Compute status badges
  let statusBadge = { label: 'Available', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (event.status === 'cancelled') {
    statusBadge = { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  } else if (event.status === 'completed') {
    statusBadge = { label: 'Completed', color: 'bg-gray-100 text-gray-700 border-gray-200' };
  } else if (isExpired) {
    statusBadge = { label: 'Registration Closed', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  } else if (event.isFull) {
    statusBadge = { label: 'Full', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  } else if (event.seatsRemaining && event.seatsRemaining < 10) {
    statusBadge = { label: 'Almost Full', color: 'bg-orange-50 text-orange-700 border-orange-200' };
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/student/events"
          className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-brand-600 transition-colors"
        >
          ← Back to All Events
        </Link>
      </div>

      {/* Large Banner Card */}
      <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500 text-white shadow">
              {event.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border bg-white/90 ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight drop-shadow-sm">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Info & Action Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Event Description
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Schedule & Location
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                  <div className="text-xs text-gray-400 font-semibold mb-1">Date</div>
                  <div className="font-bold text-gray-800 dark:text-white">
                    {new Date(event.date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                  <div className="text-xs text-gray-400 font-semibold mb-1">Time</div>
                  <div className="font-bold text-gray-800 dark:text-white">{event.time}</div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/40 sm:col-span-2">
                  <div className="text-xs text-gray-400 font-semibold mb-1">Venue</div>
                  <div className="font-bold text-gray-800 dark:text-white">{event.venue}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Organizer Details
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold text-lg">
                  👤
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{orgName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{orgDept} Faculty</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky RSVP Action Card (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Enrollment Status
            </h3>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span>Capacity:</span>
                <span className="font-bold text-gray-900 dark:text-white">{event.capacity} seats</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span>Seats Available:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {event.seatsRemaining} seats left
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span>Deadline:</span>
                <span className="font-medium">
                  {new Date(event.registrationDeadline).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Registration State and Action Button */}
            {userRegistration ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <span>✓</span> You are registered for this event!
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Enrolled on: {new Date(userRegistration.registeredAt).toLocaleDateString()}
                </div>
                {event.status === 'upcoming' && (
                  <button
                    onClick={handleCancelRegistration}
                    disabled={actionLoading}
                    className="w-full py-2 rounded-lg bg-white dark:bg-gray-800 border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Registration'}
                  </button>
                )}
              </div>
            ) : event.status === 'cancelled' ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 text-xs font-medium">
                This event has been cancelled by the organizers.
              </div>
            ) : event.status === 'completed' ? (
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                This event has concluded.
              </div>
            ) : isExpired ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 text-xs font-medium">
                The registration deadline for this event has passed.
              </div>
            ) : event.isFull ? (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 text-xs font-medium">
                Event is fully booked. No remaining seats.
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={actionLoading}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Confirming...' : 'Register for Event'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
