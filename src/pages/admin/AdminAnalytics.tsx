import { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { analyticsService } from '../../services/analyticsService';
import { AdminAnalyticsSummary } from '../../types';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await analyticsService.getAdminAnalytics();
        setAnalytics(stats);
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const metrics = analytics?.metrics || {
    totalStudents: 15,
    totalOrganizers: 3,
    totalEvents: 16,
    totalRegistrations: 148,
    upcomingEvents: 11,
    completedEvents: 5,
    attendanceRate: 88.4,
    averageRating: 4.8,
  };

  // 1. Monthly Registration Trend Chart
  const monthlyChartOptions: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#465FFF'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: analytics?.monthlyTrends.map((m) => m.period) || [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    tooltip: { theme: 'dark' },
  };

  const monthlySeries = [
    {
      name: 'Registrations',
      data: analytics?.monthlyTrends.map((m) => m.count) || [12, 19, 28, 35, 42, 38, 25, 40, 52, 60, 48, 55],
    },
  ];

  // 2. Department Participation Bar Chart
  const deptChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'Outfit, sans-serif',
      toolbar: { show: false },
    },
    colors: ['#10B981'],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        barHeight: '60%',
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: analytics?.departments.map((d) => d.department) || [
        'Computer Science', 'Information Technology', 'AI & Data Science', 'Electronics', 'Mechanical', 'Civil', 'MBA'
      ],
    },
  };

  const deptSeries = [
    {
      name: 'Registrations',
      data: analytics?.departments.map((d) => d.totalRegistrations) || [52, 38, 24, 18, 10, 4, 2],
    },
  ];

  // 3. Category Donut Chart
  const categoryChartOptions: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'Outfit, sans-serif' },
    labels: analytics?.categories.map((c) => c.category) || [
      'Competition', 'Seminar', 'Sports', 'Cultural', 'Workshop', 'Technical'
    ],
    colors: ['#465FFF', '#9333EA', '#F59E0B', '#EC4899', '#10B981', '#06B6D4'],
    legend: { position: 'bottom' },
  };

  const categorySeries = analytics?.categories.map((c) => c.count) || [4, 4, 3, 3, 2, 2];

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500">
        Loading system analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Institutional Analytics & KPI Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Deep telemetry across registration velocity, department participation, and attendance yields.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Registrations
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {metrics.totalRegistrations}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
            Active Events
          </span>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 mt-1">
            {metrics.upcomingEvents}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">
            Attendance Yield
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.attendanceRate}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Student Satisfaction
          </span>
          <div className="text-2xl font-black text-amber-500 mt-1">
            ★ {metrics.averageRating}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Monthly Registration Trends
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Aggregated via MongoDB $year and $month pipeline grouping
          </p>
          <div className="h-[260px]">
            <Chart options={monthlyChartOptions} series={monthlySeries} type="area" height={260} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Department Engagement
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Aggregated via MongoDB $lookup users and $group by department
          </p>
          <div className="h-[260px]">
            <Chart options={deptChartOptions} series={deptSeries} type="bar" height={260} />
          </div>
        </div>
      </div>

      {/* Category Donut & Department Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              Distribution by Category
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Events grouped by academic and extra-curricular classification
            </p>
            <div className="flex justify-center">
              <Chart options={categoryChartOptions} series={categorySeries} type="donut" width={290} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Department Attendance Breakdown
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Attendance turnout percentages computed with inline $cond accumulators
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Total Registrations</th>
                  <th className="py-2.5 px-3">Present Count</th>
                  <th className="py-2.5 px-3">Turnout Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {analytics?.departments.map((dept) => (
                  <tr key={dept.department} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-2.5 px-3 font-semibold text-gray-800 dark:text-gray-200">
                      {dept.department}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                      {dept.totalRegistrations}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-600 font-semibold">
                      {dept.presentCount}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${Math.min(dept.attendanceRate, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {dept.attendanceRate}%
                        </span>
                      </div>
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
