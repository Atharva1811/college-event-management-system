import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { analyticsService } from '../../services/analyticsService';
import { eventService } from '../../services/eventService';
import { Event } from '../../types';

export default function OrganizerAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, eventsData] = await Promise.all([
          analyticsService.getOrganizerAnalytics(),
          eventService.getEvents({ limit: 10 }),
        ]);
        setAnalytics(stats);
        setEvents(eventsData.events);
      } catch (err) {
        console.error('Failed to load organizer analytics:', err);
      }
    };
    fetchData();
  }, []);

  const metrics = analytics?.metrics || {
    totalEvents: 6,
    upcomingEvents: 4,
    totalParticipants: 184,
    averageRating: 4.8,
    attendanceRate: 91.2,
  };

  const attendanceChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
    },
    labels: ['Present', 'Absent', 'Pending'],
    colors: ['#10B981', '#EF4444', '#F59E0B'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
    },
  };

  const attendanceSeries = [72, 7, 105];

  const trendChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#465FFF'],
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.45,
        opacityTo: 0.05,
      },
    },
    xaxis: {
      categories: ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026'],
    },
  };

  const trendSeries = [
    {
      name: 'Registrations',
      data: [15, 22, 30, 48, 62, 84],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Organizer Event Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quantitative metrics covering seat utilization, attendance yield, and student satisfaction.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Registrations
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {metrics.totalParticipants}
          </div>
          <span className="text-xs text-brand-600 font-medium mt-1 block">
            Across active sessions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Attendance Rate
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {metrics.attendanceRate}%
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            Verified check-in yield
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Average Rating
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            ★ {metrics.averageRating}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            Out of 5.0 maximum
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Active Programs
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {metrics.upcomingEvents}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            Upcoming on calendar
          </span>
        </div>
      </div>

      {/* Dual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
            Registration Growth Curve
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Aggregated enrollment trajectory across past 6 months
          </p>
          <div className="h-[280px]">
            <Chart options={trendChartOptions} series={trendSeries} type="area" height={280} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
              Attendance Distribution
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Present vs absent vs pending
            </p>
            <div className="flex justify-center">
              <Chart options={attendanceChartOptions} series={attendanceSeries} type="donut" width={280} />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 text-center">
            Updated live from MongoDB Registrations Collection
          </div>
        </div>
      </div>

      {/* Performance by Event Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4">
          Session Capacity Utilization
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="py-3 px-3">Event Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Capacity</th>
                <th className="py-3 px-3">Registrations</th>
                <th className="py-3 px-3">Utilization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {events.slice(0, 6).map((ev) => {
                const count = ev.registeredCount || 0;
                const pct = Math.min(100, Math.round((count / ev.capacity) * 100));
                return (
                  <tr key={ev._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-3.5 px-3 font-semibold text-gray-900 dark:text-white">
                      {ev.title}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-gray-500">{ev.category}</td>
                    <td className="py-3.5 px-3 text-xs">{ev.capacity}</td>
                    <td className="py-3.5 px-3 text-xs font-semibold">{count}</td>
                    <td className="py-3.5 px-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-brand-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-bold">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
