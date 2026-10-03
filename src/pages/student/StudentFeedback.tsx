import React, { useEffect, useState, useCallback } from 'react';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../context/ToastContext';
import { Registration } from '../../types';

export default function StudentFeedback() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await registrationService.getMyRegistrations();
      setRegistrations(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch registrations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Completed events where student attended
  const eligibleEvents = registrations.filter((r) => {
    const ev = typeof r.event === 'object' ? r.event : null;
    return ev?.status === 'completed' && r.attendance === 'present';
  });

  const pendingFeedbackList = eligibleEvents.filter((r) => !r.rating);
  const submittedFeedbackList = eligibleEvents.filter((r) => Boolean(r.rating));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    if (!feedback.trim()) {
      showToast('Please provide a comment for your feedback.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await registrationService.submitFeedback(selectedReg._id, rating, feedback);
      showToast('Feedback submitted successfully! Thank you.', 'success');
      setSelectedReg(null);
      setFeedback('');
      setRating(5);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Event Feedback & Reviews
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Share your experience for completed campus events to help organizers improve future editions.
        </p>
      </div>

      {/* Feedback Submission Modal / Form */}
      {selectedReg && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border-2 border-brand-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400">
                Submit Event Review
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {typeof selectedReg.event === 'object' ? selectedReg.event.title : 'Event'}
              </h3>
            </div>
            <button
              onClick={() => setSelectedReg(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Your Rating (1 to 5 Stars)
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                      star <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-2">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Your Comments & Suggestions
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What did you think of the speakers, workshops, facilities, and coordination?"
                className="w-full p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Post Feedback'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Reviews Section */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>Pending Feedback</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            {pendingFeedbackList.length}
          </span>
        </h3>

        {loading ? (
          <div className="text-xs text-gray-400 py-4">Checking completed events...</div>
        ) : pendingFeedbackList.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You have no pending feedback for completed sessions. Great job keeping up!
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
            {pendingFeedbackList.map((reg) => {
              const ev = typeof reg.event === 'object' ? reg.event : null;
              return (
                <div key={reg._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {ev?.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Concluded on {ev ? new Date(ev.date).toLocaleDateString() : ''} • Verified Attendance
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReg(reg);
                      setRating(5);
                      setFeedback('');
                    }}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Give Feedback →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submitted Reviews History */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>Submitted Reviews</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            {submittedFeedbackList.length}
          </span>
        </h3>

        {submittedFeedbackList.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You haven't submitted any feedback yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submittedFeedbackList.map((reg) => {
              const ev = typeof reg.event === 'object' ? reg.event : null;
              return (
                <div
                  key={reg._id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750/30 border border-gray-200/60 dark:border-gray-700/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {ev?.title}
                    </h4>
                    <div className="text-amber-400 text-sm">
                      {'★'.repeat(reg.rating || 5)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                    "{reg.feedback}"
                  </p>
                  <span className="text-[10px] text-gray-400 block pt-1">
                    Submitted on {reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : 'Recorded'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
