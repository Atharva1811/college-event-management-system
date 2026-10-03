import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../context/ToastContext';
import { Event, Registration, AttendanceStatus } from '../../types';

export default function OrganizerParticipants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentEventParam = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [participants, setParticipants] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { showToast } = useToast();

  // Load organizer's events list
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await eventService.getEvents({ limit: 50 });
        setEvents(data.events);
        if (data.events.length > 0) {
          const initialId = currentEventParam || data.events[0]._id;
          setSelectedEventId(initialId);
        }
      } catch (err) {
        console.error('Failed to load events for participants:', err);
      }
    };
    loadEvents();
  }, [currentEventParam]);

  // Load participants for selected event
  const loadParticipants = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const data = await registrationService.getEventParticipants(selectedEventId);
      setParticipants(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load participants', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, showToast]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const handleUpdateAttendance = async (
    registrationId: string,
    newStatus: AttendanceStatus,
    studentName: string
  ) => {
    setUpdatingId(registrationId);
    try {
      await registrationService.updateAttendance(registrationId, newStatus);
      showToast(
        `Marked ${studentName} as ${newStatus.toUpperCase()}`,
        'success'
      );
      await loadParticipants();
    } catch (err: any) {
      showToast(err.message || 'Failed to update attendance', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const stu = typeof p.student === 'object' ? p.student : null;
    const nameMatch =
      !search ||
      (stu && stu.name.toLowerCase().includes(search.toLowerCase())) ||
      (stu && stu.email.toLowerCase().includes(search.toLowerCase()));

    const statusMatch =
      attendanceFilter === 'All' || p.attendance === attendanceFilter;

    return nameMatch && statusMatch;
  });

  const presentCount = participants.filter((p) => p.attendance === 'present').length;
  const absentCount = participants.filter((p) => p.attendance === 'absent').length;
  const pendingCount = participants.filter((p) => p.attendance === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Event Participant Roster & Attendance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Verify student enrollments, record check-ins, and mark attendance in real-time.
          </p>
        </div>

        {/* Event Selector Dropdown */}
        <div className="w-full sm:w-72">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setSearchParams({ event: e.target.value });
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-white shadow-sm focus:border-brand-500"
          >
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60">
          <span className="text-xs font-semibold text-gray-400 uppercase">Total Enrolled</span>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {participants.length} / {selectedEvent?.capacity || 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Present</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{presentCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60">
          <span className="text-xs font-semibold text-rose-600 uppercase">Absent</span>
          <div className="text-xl font-bold text-rose-600 mt-1">{absentCount}</div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60">
          <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
          <div className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search student by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50/50 dark:bg-gray-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-400">Filter Attendance:</span>
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800"
          >
            <option value="All">All Statuses</option>
            <option value="present">Present Only</option>
            <option value="absent">Absent Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading student roster...</div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No participants found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Enrolled At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Attendance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredParticipants.map((reg) => {
                  const stu = typeof reg.student === 'object' ? reg.student : null;
                  const studentName = stu?.name || 'Student';

                  return (
                    <tr key={reg._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {studentName}
                        </div>
                        <div className="text-xs text-gray-400">{stu?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {stu?.department || 'General'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {stu?.phone || '--'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {new Date(reg.registeredAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold uppercase rounded-md ${
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

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleUpdateAttendance(reg._id, 'present', studentName)}
                          disabled={updatingId === reg._id || reg.attendance === 'present'}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-30 cursor-pointer"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleUpdateAttendance(reg._id, 'absent', studentName)}
                          disabled={updatingId === reg._id || reg.attendance === 'absent'}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-30 cursor-pointer"
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleUpdateAttendance(reg._id, 'pending', studentName)}
                          disabled={updatingId === reg._id || reg.attendance === 'pending'}
                          className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                        >
                          Reset
                        </button>
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
