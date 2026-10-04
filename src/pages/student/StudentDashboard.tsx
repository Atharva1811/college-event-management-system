import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { useAuth } from '../../context/AuthContext';
import { Event, Registration } from '../../types';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, regsRes] = await Promise.all([
          eventService.getEvents({ limit: 4, status: 'upcoming' }),
          registrationService.getMyRegistrations(),
        ]);
        setUpcomingEvents(eventsRes.events);
        setMyRegistrations(regsRes);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeRegistrations = myRegistrations.filter((r) => r.status === 'registered');
  const attendedCount = myRegistrations.filter(
    (r) => r.status === 'registered' && r.attendance === 'present'
  ).length;
  const pendingFeedbackCount = myRegistrations.filter(
    (r) =>
      r.status === 'registered' &&
      r.attendance === 'present' &&
      !r.rating
  ).length;

  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const monthlyCounts: Record<string, number> = { May: 0, Jun: 0, Jul: 0, Aug: 0, Sep: 0, Oct: 0 };
  myRegistrations.forEach((r) => {
    if (r.registeredAt && r.status === 'registered') {
      const d = new Date(r.registeredAt);
      const m = d.toLocaleString('en-US', { month: 'short' });
      if (monthlyCounts[m] !== undefined) {
        monthlyCounts[m] += 1;
      }
    }
  });

  const studentChartData = myRegistrations.length > 0
    ? months.map((m) => monthlyCounts[m])
    : [1, 2, 1, 3, 4, 2];

  const chartOptions: ApexOptions = {
    colors: ['#465FFF'],
    chart: {
      fontFamily: 'Outfit, sans-serif',
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '40%',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: months,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    grid: {
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
  };

  const chartSeries = [
    {
      name: 'Registrations',
      data: studentChartData,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-brand-500/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
            Student Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">
            Welcome back, {currentUser?.name}!
          </h1>
          <p className="text-sm sm:text-base text-brand-100 leading-relaxed">
            Department of {currentUser?.department || 'Engineering'}. Explore upcoming university hackathons, workshops, and sports meets.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/student/events"
              className="px-5 py-2.5 rounded-xl bg-white text-brand-700 font-bold text-sm shadow hover:bg-brand-50 transition-colors"
            >
              Browse Event Catalog →
            </Link>
            <Link
              to="/student/registrations"
              className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm transition-colors"
            >
              View My Registrations
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Upcoming Events
            </span>
            <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 text-lg">
              📅
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {loading ? '...' : upcomingEvents.length}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            Accepting registrations now
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Registrations
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-lg">
              🎟️
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {loading ? '...' : activeRegistrations.length}
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            Enrolled campus events
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Present Attendance
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-lg">
              ✅
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {loading ? '...' : attendedCount}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
            Verified completed sessions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pending Feedback
            </span>
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-lg">
              ⭐
            </span>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            {loading ? '...' : pendingFeedbackCount}
          </div>
          <Link
            to="/student/feedback"
            className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-1 block hover:underline"
          >
            Review completed events →
          </Link>
        </div>
      </div>

      {/* Main Grid: Chart + Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Activity Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                My Participation Trend
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Monthly event registration timeline
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              Semester 2026
            </span>
          </div>
          <div className="h-[250px]">
            <Chart options={chartOptions} series={chartSeries} type="bar" height={250} />
          </div>
        </div>

        {/* Quick Spotlight Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Top Pick For You
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                Open RSVP
              </span>
            </div>
            {upcomingEvents[0] ? (
              <div>
                <img
                  src={upcomingEvents[0].image}
                  alt={upcomingEvents[0].title}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
                <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 mb-1">
                  {upcomingEvents[0].title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {upcomingEvents[0].description}
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  <div>📍 {upcomingEvents[0].venue}</div>
                  <div>👥 {upcomingEvents[0].seatsRemaining} seats remaining</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No events currently spotlighted.</p>
            )}
          </div>
          {upcomingEvents[0] && (
            <Link
              to={`/student/events/${upcomingEvents[0]._id}`}
              className="mt-4 w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs text-center shadow-md transition-colors"
            >
              View & Register
            </Link>
          )}
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Recent Registrations
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your latest enrollment records and attendance status
            </p>
          </div>
          <Link
            to="/student/registrations"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            See All →
          </Link>
        </div>

        {myRegistrations.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            You haven't registered for any events yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3 px-3">Event Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Attendance</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {myRegistrations.slice(0, 5).map((reg) => {
                  const ev = typeof reg.event === 'object' ? reg.event : null;
                  return (
                    <tr key={reg._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-3.5 px-3 font-semibold text-gray-900 dark:text-white">
                        {ev?.title || 'Event Record'}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {ev?.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md ${
                            reg.status === 'registered'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-md ${
                            reg.attendance === 'present'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                              : reg.attendance === 'absent'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                          }`}
                        >
                          {reg.attendance}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {ev && (
                          <Link
                            to={`/student/events/${ev._id}`}
                            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            Details
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
