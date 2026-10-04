import { useEffect, useState } from 'react';
import { registrationService } from '../../services/registrationService';
import { Registration } from '../../types';

export default function StudentAttendance() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await registrationService.getMyRegistrations();
        setRegistrations(data);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const total = registrations.length;
  const presentCount = registrations.filter((r) => r.attendance === 'present').length;
  const absentCount = registrations.filter((r) => r.attendance === 'absent').length;
  const pendingCount = registrations.filter((r) => r.attendance === 'pending').length;

  const rate =
    presentCount + absentCount > 0
      ? ((presentCount / (presentCount + absentCount)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Attendance Record
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your official attendance across workshops, competitions, and seminars.
        </p>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Sessions
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {total}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Registered events</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Present
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {presentCount}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Confirmed attended</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Absent
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {absentCount}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Missed sessions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Attendance Rate
          </div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {rate}%
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">Completed participation</span>
        </div>
      </div>

      {/* Attendance List */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Detailed Log
          </h3>
          <span className="text-xs text-gray-400">
            {pendingCount} Pending Verification
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading attendance data...</div>
        ) : registrations.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">No attendance records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Attendance Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {registrations.map((reg) => {
                  const ev = typeof reg.event === 'object' ? reg.event : null;
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        {ev?.title || 'Unknown Event'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {ev?.category || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {ev ? new Date(ev.date).toLocaleDateString() : '--'}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        {ev?.venue || '--'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase rounded-md ${
                            reg.attendance === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : reg.attendance === 'absent'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {reg.attendance === 'present' && '● Present'}
                          {reg.attendance === 'absent' && '✕ Absent'}
                          {reg.attendance === 'pending' && '⏳ Pending'}
                        </span>
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
