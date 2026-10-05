import { useEffect, useState, useCallback } from 'react';
import { registrationService } from '../../services/registrationService';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import { Registration, Event, Department } from '../../types';
import DatePicker from '../../components/form/DatePicker';

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

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedAttendance, setSelectedAttendance] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [regs, evs] = await Promise.all([
        registrationService.getAllRegistrations(),
        eventService.getEvents({ limit: 100 }),
      ]);
      setRegistrations(regs);
      setEvents(evs.events);
    } catch (err: any) {
      showToast(err.message || 'Failed to load registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side multi-criteria filtering
  const filteredRegistrations = registrations.filter((reg) => {
    const stu = typeof reg.student === 'object' ? reg.student : null;
    const ev = typeof reg.event === 'object' ? reg.event : null;

    if (selectedEventId !== 'All' && ev?._id !== selectedEventId) return false;
    if (selectedDept !== 'All' && stu?.department !== selectedDept) return false;
    if (selectedAttendance !== 'All' && reg.attendance !== selectedAttendance) return false;
    if (selectedStatus !== 'All' && reg.status !== selectedStatus) return false;

    if (fromDate) {
      const regDate = new Date(reg.registeredAt).toISOString().split('T')[0];
      if (regDate < fromDate) return false;
    }
    if (toDate) {
      const regDate = new Date(reg.registeredAt).toISOString().split('T')[0];
      if (regDate > toDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Global Registrations Ledger
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete MongoDB Registrations Collection records linking students to events.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
          {filteredRegistrations.length} Records Shown
        </span>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-gray-400 font-semibold mb-1">Filter by Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus:outline-none"
            >
              <option value="All">All Events</option>
              {events.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Filter by Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Attendance Status</label>
            <select
              value={selectedAttendance}
              onChange={(e) => setSelectedAttendance(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 font-semibold mb-1">Registration Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 focus:outline-none"
            >
              <option value="All">All States</option>
              <option value="registered">Active (registered)</option>
              <option value="cancelled">Soft-Cancelled</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row with DatePicker Calendar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Registered From (Calendar)</label>
            <DatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="Filter registered from..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Registered To (Calendar)</label>
            <DatePicker
              value={toDate}
              minDate={fromDate || undefined}
              onChange={(val) => setToDate(val)}
              placeholder="Filter registered to..."
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

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading registrations...</div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No registrations found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Enrolled Event</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Registration Status</th>
                  <th className="py-3.5 px-4">Attendance</th>
                  <th className="py-3.5 px-4 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredRegistrations.map((reg) => {
                  const stu = typeof reg.student === 'object' ? reg.student : null;
                  const ev = typeof reg.event === 'object' ? reg.event : null;

                  return (
                    <tr key={reg._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {stu?.name || 'Student'}
                        </div>
                        <div className="text-xs text-gray-400">{stu?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-800 dark:text-gray-200">
                        {ev?.title || 'Unknown Event'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {stu?.department || 'General'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold uppercase rounded-md ${
                            reg.status === 'registered'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {reg.status}
                        </span>
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

                      <td className="py-3.5 px-4 text-xs text-gray-400 text-right">
                        {new Date(reg.registeredAt).toLocaleDateString()}
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
