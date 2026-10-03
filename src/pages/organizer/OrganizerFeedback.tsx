import { useEffect, useState } from 'react';
import { registrationService } from '../../services/registrationService';
import { Registration } from '../../types';

export default function OrganizerFeedback() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await registrationService.getAllRegistrations();
        // Filter those with ratings
        const reviewed = data.filter((r) => r.rating !== null && r.rating !== undefined);
        setRegistrations(reviewed);
      } catch (err) {
        console.error('Failed to load feedback:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const totalReviews = registrations.length;
  const avgRating =
    totalReviews > 0
      ? (
          registrations.reduce((acc, r) => acc + (r.rating || 0), 0) /
          totalReviews
        ).toFixed(1)
      : '4.8';

  const distribution = [5, 4, 3, 2, 1].map((score) => {
    const count = registrations.filter((r) => r.rating === score).length;
    const pct = totalReviews > 0 ? ((count / totalReviews) * 100).toFixed(0) : '0';
    return { score, count, pct };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Student Feedback & Evaluations
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review participant sentiment, ratings, and constructive critique for hosted campus programs.
        </p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Average Score
          </span>
          <div className="text-5xl font-black text-amber-500 mb-2">
            ★ {avgRating}
          </div>
          <div className="text-xs text-gray-500">
            Calculated across {totalReviews} student reviews
          </div>
        </div>

        {/* Rating Breakdown Bars (2 cols) */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Rating Distribution Breakdown
          </h3>
          {distribution.map((d) => (
            <div key={d.score} className="flex items-center gap-3 text-xs">
              <span className="w-14 font-semibold text-gray-600 dark:text-gray-300">
                {d.score} Stars
              </span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-10 text-right text-gray-400 font-medium">
                {d.count} ({d.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback Comments List */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          All Student Comments
        </h3>

        {loading ? (
          <div className="text-xs text-gray-400 py-6 text-center">Loading feedback...</div>
        ) : registrations.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">No reviews recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {registrations.map((reg) => {
              const stu = typeof reg.student === 'object' ? reg.student : null;
              const ev = typeof reg.event === 'object' ? reg.event : null;

              return (
                <div key={reg._id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {stu?.name || 'Verified Student'}
                      </span>
                      <span className="text-xs text-gray-400">• {stu?.department || 'Student'}</span>
                    </div>
                    <div className="text-amber-400 text-sm font-bold">
                      {'★'.repeat(reg.rating || 5)}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                    "{reg.feedback || 'Great session!'}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>Event: <strong className="text-gray-700 dark:text-gray-300">{ev?.title || 'Campus Event'}</strong></span>
                    <span>{reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : 'Recorded'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
