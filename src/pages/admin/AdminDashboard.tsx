import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { analyticsService } from '../../services/analyticsService';
import { eventService } from '../../services/eventService';
import { AdminAnalyticsSummary, Event } from '../../types';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [topEvents, setTopEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, eventsData] = await Promise.all([
          analyticsService.getAdminAnalytics(),
          eventService.getEvents({ limit: 5, sort: 'capacity', order: 'desc' }),
        ]);
        setAnalytics(stats);
        setTopEvents(eventsData.events);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = analytics?.metrics || {
    totalStudents: 0,
    totalOrganizers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    attendanceRate: 0,
    averageRating: 0,
  };

  // 1. Monthly Registration Trend Chart
  const monthlyChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#465FFF'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.45, opacityTo: 0.05 },
    },
    xaxis: {
      categories: analytics?.monthlyTrends?.map((t) => t.period) || [],
    },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
  };

  const monthlySeries = [
    {
      name: 'Registrations',
      data: analytics?.monthlyTrends?.map((t) => t.count) || [],
    },
  ];

  // 2. Department Participation Chart
  const deptChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { borderRadius: 4, horizontal: true, barHeight: '55%' },
    },
    colors: ['#10B981'],
    dataLabels: { enabled: false },
    xaxis: {
      categories:
        analytics?.departments?.map((d) => d.department.replace(' & Data Science', '')) || [],
    },
  };

  const deptSeries = [
    {
      name: 'Registrations',
      data: analytics?.departments?.map((d) => d.totalRegistrations) || [],
    },
  ];

  // 3. Category Donut Chart
  const categoryChartOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    labels: analytics?.categories?.map((c) => c.category) || [],
    colors: ['#465FFF', '#9333EA', '#F59E0B', '#EC4899', '#10B981'],
    legend: { position: 'bottom' },
  };

  const categorySeries = analytics?.categories?.map((c) => c.count) || [];

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500">
        Loading admin dashboard analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & ADBMS Quicklink */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            System Administration & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Global college governance dashboard. Data aggregated via native MongoDB aggregation pipelines.
          </p>
        </div>

        <Link
          to="/admin/database-insights"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 hover:opacity-95 transition-opacity"
        >
          <span>⚡ MongoDB Database Insights</span>
          <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">Viva</span>
        </Link>
      </div>

      {/* Real-time Governance Approvals Quick Action Cards (Requirements 7, 8, 42) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-200/80 dark:border-purple-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center text-xl shrink-0">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Admin Applications
                </h3>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                  (metrics.pendingAdminApplications ?? 0) > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 animate-pulse'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {metrics.pendingAdminApplications ?? 0} Pending
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Review faculty and staff requests for administrator privileges
              </p>
            </div>
          </div>
          <Link
            to="/admin/applications"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20 transition-all shrink-0"
          >
            Review Applications
          </Link>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent border border-blue-200/80 dark:border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xl shrink-0">
              🎓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  Organizer Applications
                </h3>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                  (metrics.pendingOrganizerApplications ?? 0) > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {metrics.pendingOrganizerApplications ?? 0} Pending
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Review department organizer upgrade requests
              </p>
            </div>
          </div>
          <Link
            to="/admin/organizers"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all shrink-0"
          >
            Review Organizers
          </Link>
        </div>
      </div>

      {/* 8 Comprehensive Cards (2 rows of 4) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Students
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {metrics.totalStudents}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Enrolled undergraduates</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Organizers
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {metrics.totalOrganizers}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Faculty coordinators</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Total Events
          </span>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {metrics.totalEvents}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Campus initiatives</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Total Registrations
          </span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {metrics.totalRegistrations}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Stored in MongoDB</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Upcoming Events
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {metrics.upcomingEvents}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Active on calendar</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Completed Events
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {metrics.completedEvents}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Archived with reviews</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Attendance Rate
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {metrics.attendanceRate}%
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Turnout yield</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Average Rating
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            ★ {metrics.averageRating}
          </div>
          <span className="text-[11px] text-gray-500 mt-0.5 block">Student satisfaction</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Monthly Registration Trends
              </h3>
              <p className="text-xs text-gray-400">
                MongoDB $group by year & month aggregation
              </p>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg">
              Semester
            </span>
          </div>
          <div className="h-[260px]">
            <Chart options={monthlyChartOptions} series={monthlySeries} type="area" height={260} />
          </div>
        </div>

        {/* Department Participation Bar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Department Participation
              </h3>
              <p className="text-xs text-gray-400">
                MongoDB $lookup Users + $group by Department
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
              Turnout
            </span>
          </div>
          <div className="h-[260px]">
            <Chart options={deptChartOptions} series={deptSeries} type="bar" height={260} />
          </div>
        </div>
      </div>

      {/* Secondary Row: Donut + Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Events by Category
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              MongoDB $group by category count
            </p>
            <div className="flex justify-center">
              <Chart options={categoryChartOptions} series={categorySeries} type="donut" width={290} />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
            Categorical representation across all academic faculties
          </div>
        </div>

        {/* Top Events Table (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                High-Capacity Campus Events
              </h3>
              <p className="text-xs text-gray-400">
                Top events sorted by seating capacity and student turnout
              </p>
            </div>
            <Link
              to="/admin/events"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              All Events →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Registrations</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-xs">
                {topEvents.map((ev) => (
                  <tr key={ev._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                      {ev.title}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{ev.category}</td>
                    <td className="py-3 px-3 font-medium">{ev.capacity}</td>
                    <td className="py-3 px-3 font-bold text-brand-600 dark:text-brand-400">
                      {ev.registeredCount || 0}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
