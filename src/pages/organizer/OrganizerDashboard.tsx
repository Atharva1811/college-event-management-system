import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { eventService } from '../../services/eventService';
import { analyticsService } from '../../services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';

export default function OrganizerDashboard() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, stats] = await Promise.all([
          eventService.getEvents({ limit: 6 }),
          analyticsService.getOrganizerAnalytics(),
        ]);
        setEvents(eventsData.events);
        setAnalytics(stats);
      } catch (err) {
        console.error('Failed to load organizer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = analytics?.metrics || {
    totalEvents: 6,
    upcomingEvents: 4,
    totalParticipants: 184,
    averageRating: 4.8,
  };

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
        columnWidth: '45%',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: ['Hackathon', 'AI Workshop', 'CyberSec', 'Cricket', 'Cultural', 'Robotics'],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
  };

  const chartSeries = [
    {
      name: 'Registrations',
      data: [84, 42, 135, 150, 220, 38],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Organizer Command Center
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Welcome, {currentUser?.name}. Manage your events, attendance, and participant analytics.
          </p>
        </div>
        <Link
          to="/organizer/events/create"
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all text-center"
        >
          + Create New Event
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Events
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {metrics.totalEvents}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">Campus activities created</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Upcoming Events
          </span>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {metrics.upcomingEvents}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">Currently accepting RSVPs</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Total Participants
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.totalParticipants}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">Across all hosted sessions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Average Rating
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            ★ {metrics.averageRating}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">Student feedback score</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Registrations by Event
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audience turn-out distribution across flagship college programs
            </p>
          </div>
          <Link
            to="/organizer/analytics"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Detailed Analytics →
          </Link>
        </div>
        <div className="h-[260px]">
          <Chart options={chartOptions} series={chartSeries} type="bar" height={260} />
        </div>
      </div>

      {/* Events Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              My Active Events
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage capacity, participant rosters, and mark attendance
            </p>
          </div>
          <Link
            to="/organizer/events"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Manage All Events →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-6 text-xs text-gray-400">Loading events...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Capacity & Enrollment</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {events.slice(0, 5).map((ev) => (
                  <tr key={ev._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                    <td className="py-3.5 px-3 font-semibold text-gray-900 dark:text-white">
                      {ev.title}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-gray-500">
                      {ev.category}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-gray-500">
                      {new Date(ev.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 text-xs">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {ev.registeredCount || 0}
                      </span>{' '}
                      / {ev.capacity} seats
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase rounded-md ${
                          ev.status === 'upcoming'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <Link
                        to={`/organizer/events/${ev._id}/edit`}
                        className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-600"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/organizer/participants?event=${ev._id}`}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Participants
                      </Link>
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
