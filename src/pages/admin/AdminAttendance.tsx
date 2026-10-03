import { useEffect, useState, useCallback } from 'react';
import { registrationService } from '../../services/registrationService';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import { Registration, Event, Department } from '../../types';

const departments: Array<Department | 'All'> = [
  'All',
  'Computer Science',
  'Information Technology',
  'AI & Data Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'MBA',
];

export default function AdminAttendance() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEvent, setSelectedEvent] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<Department | 'All'>('All');
  const [selectedAttendance, setSelectedAttendance] = useState<string>('All');
  const [search, setSearch] = useState('');

  const { showToast } = useToast();

  const getStudent = (r: Registration) =>
    typeof r.student === 'object' && r.student !== null ? r.student : null;
  const getEvent = (r: Registration) =>
    typeof r.event === 'object' && r.event !== null ? r.event : null;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [regData, eventData] = await Promise.all([
        registrationService.getAllRegistrations(),
        eventService.getEvents({ limit: 50 }),
      ]);
      setRegistrations(regData);
      setEvents(eventData.events);
    } catch (err: any) {
      showToast(err.message || 'Failed to load attendance records', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateAttendance = async (regId: string, newStatus: 'present' | 'absent') => {
    try {
      await registrationService.updateAttendance(regId, newStatus);
      showToast(`Attendance marked as ${newStatus}`, 'success');
      setRegistrations((prev) =>
        prev.map((r) => (r._id === regId ? { ...r, attendance: newStatus } : r))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update attendance', 'error');
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    const student = getStudent(r);
    const event = getEvent(r);

    if (selectedEvent !== 'All') {
      const eId = event ? event._id : (r.event as string);
      if (eId !== selectedEvent) return false;
    }

    if (selectedDept !== 'All') {
      if (!student || student.department !== selectedDept) return false;
    }

    if (selectedAttendance !== 'All') {
      if (r.attendance !== selectedAttendance) return false;
    }

    if (search) {
      const s = search.toLowerCase();
      const studentName = student?.name?.toLowerCase() || '';
      const studentEmail = student?.email?.toLowerCase() || '';
      const eventTitle = event?.title?.toLowerCase() || '';
      return studentName.includes(s) || studentEmail.includes(s) || eventTitle.includes(s);
    }

    return true;
  });

  const total = filteredRegistrations.length;
  const presentCount = filteredRegistrations.filter((r) => r.attendance === 'present').length;
  const absentCount = filteredRegistrations.filter((r) => r.attendance === 'absent').length;
  const pendingCount = filteredRegistrations.filter((r) => r.attendance === 'pending').length;
  const turnoutRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Campus-Wide Attendance Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Global attendance audits, QR verification log, and real-time student turnout rate.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Audited
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
            Present
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {presentCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
            Absent
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {absentCount}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
            Turnout Rate
          </span>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {turnoutRate}%
          </div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">{pendingCount} pending</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search student name, email, or event title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
        >
          <option value="All">All Events</option>
          {events.map((ev) => (
            <option key={ev._id} value={ev._id}>
              {ev.title}
            </option>
          ))}
        </select>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value as Department | 'All')}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept === 'All' ? 'All Departments' : dept}
            </option>
          ))}
        </select>

        <select
          value={selectedAttendance}
          onChange={(e) => setSelectedAttendance(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
        >
          <option value="All">All Attendance Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading attendance data...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No attendance records match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Event Date</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredRegistrations.map((reg) => {
                  const student = getStudent(reg);
                  const event = getEvent(reg);
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {student?.name || 'Unknown Student'}
                        </div>
                        <div className="text-xs text-gray-400">{student?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {student?.department || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {event?.title || 'Unknown Event'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {event?.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                      </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          reg.attendance === 'present'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : reg.attendance === 'absent'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {reg.attendance}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateAttendance(reg._id, 'present')}
                          disabled={reg.attendance === 'present'}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleUpdateAttendance(reg._id, 'absent')}
                          disabled={reg.attendance === 'absent'}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          Absent
                        </button>
                      </div>
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
