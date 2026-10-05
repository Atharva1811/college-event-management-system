import { useEffect, useState, useCallback } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { User, Pagination } from '../../types';
import { CloseIcon, EyeIcon } from '../../icons';
import Button from '../../components/ui/button/Button';

export default function AdminApplications() {
  const [applications, setApplications] = useState<User[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, denied: 0, total: 0 });
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [viewingApp, setViewingApp] = useState<User | null>(null);
  const [approvingApp, setApprovingApp] = useState<User | null>(null);
  const [denyingApp, setDenyingApp] = useState<User | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { showToast } = useToast();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAdminApplications({
        status: statusFilter,
        search,
        page,
        limit: 10,
      });
      setApplications(data.applications);
      setCounts(data.counts);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Failed to load administrator applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, showToast]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApproveConfirm = async () => {
    if (!approvingApp) return;
    setActionLoading(true);
    try {
      await userService.updateAdminStatus(approvingApp._id, 'approved');
      showToast(`Administrator privileges granted to ${approvingApp.name}!`, 'success');
      setApprovingApp(null);
      await loadApplications();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(errorObj.response?.data?.message || errorObj.message || 'Failed to approve application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDenyConfirm = async () => {
    if (!denyingApp) return;
    setActionLoading(true);
    try {
      await userService.updateAdminStatus(denyingApp._id, 'denied', denialReason.trim());
      showToast(`Administrator application for ${denyingApp.name} has been denied.`, 'success');
      setDenyingApp(null);
      setDenialReason('');
      await loadApplications();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(errorObj.response?.data?.message || errorObj.message || 'Failed to deny application', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Administrator Applications
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and govern requests for full college system administrator privileges.
          </p>
        </div>

        {/* Quick Pending Counter Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center gap-2">
            <span>Pending Review:</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[11px]">
              {counts.pending}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('approved'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'approved'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('denied'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'denied'
                ? 'bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Denied ({counts.denied})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm font-bold'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Applications ({counts.total})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-4 py-2 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-3" />
            <p>Loading administrator applications from MongoDB...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700/50 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-3">
              🛡️
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              No administrator applications found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'There are currently no pending administrator access requests requiring review.'
                : 'No applications match the selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 text-xs">
                {applications.map((app) => {
                  const isPending = app.adminStatus === 'pending';
                  const isApproved = app.adminStatus === 'approved';
                  const isDenied = app.adminStatus === 'denied';

                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors"
                    >
                      {/* Applicant Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {app.name}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono">
                              {app.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {app.department || 'General'}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                        {app.phone || 'N/A'}
                      </td>

                      {/* Current Role */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {app.role}
                        </span>
                      </td>

                      {/* Application Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            ✓ Approved
                          </span>
                        )}
                        {isDenied && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                            ✕ Denied
                          </span>
                        )}
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Details Button */}
                          <button
                            type="button"
                            onClick={() => setViewingApp(app)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View Application Details"
                            aria-label={`View application details for ${app.name}`}
                          >
                            <EyeIcon className="size-4" />
                          </button>

                          {/* Pending Actions: Approve & Deny */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setApprovingApp(app)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-[11px] transition-all"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDenyingApp(app); setDenialReason(''); }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-[11px] transition-all"
                              >
                                Deny
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {applications.length} of {pagination.total} applications
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="font-bold text-gray-900 dark:text-white px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW APPLICATION DETAILS MODAL (Requirement 10)            */}
      {/* ------------------------------------------------------------- */}
      {viewingApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-app-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <h3 id="view-app-title" className="font-bold text-gray-900 dark:text-white text-base">
                  Application Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close modal"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] block">
                    Applicant Name
                  </span>
                  <strong className="text-gray-900 dark:text-white text-sm">
                    {viewingApp.name}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] block">
                    Email Address
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 font-mono">
                    {viewingApp.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] block">
                    Department
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {viewingApp.department || 'General'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] block">
                    Phone
                  </span>
                  <span className="text-gray-800 dark:text-gray-200 font-mono">
                    {viewingApp.phone || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-gray-400 uppercase tracking-wider text-[10px] block mb-1">
                  Requested Role & Application Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold">
                    Requested: Administrator
                  </span>
                  <span className="capitalize px-2.5 py-1 rounded-lg font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    Status: {viewingApp.adminStatus}
                  </span>
                </div>
              </div>

              {viewingApp.adminReason && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] block mb-1">
                    Applicant Statement / Reason
                  </span>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    "{viewingApp.adminReason}"
                  </div>
                </div>
              )}

              {viewingApp.adminDenialReason && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] block mb-1 text-rose-500 font-bold">
                    Recorded Denial Reason
                  </span>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 leading-relaxed">
                    {viewingApp.adminDenialReason}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                <div>Submitted: {viewingApp.createdAt ? new Date(viewingApp.createdAt).toLocaleString() : 'N/A'}</div>
                {viewingApp.adminProcessedAt && (
                  <div>Processed: {new Date(viewingApp.adminProcessedAt).toLocaleString()}</div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingApp(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. APPROVE CONFIRMATION DIALOG (Requirement 11)               */}
      {/* ------------------------------------------------------------- */}
      {approvingApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approve-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mx-auto mb-4">
              🛡️
            </div>
            <h3 id="approve-modal-title" className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
              Approve Admin Application?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4 leading-relaxed">
              You are about to grant full system administrator privileges to:
            </p>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-center mb-4">
              <div className="font-bold text-gray-900 dark:text-white text-sm">
                {approvingApp.name}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {approvingApp.email}
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
                Department: {approvingApp.department || 'General'}
              </div>
            </div>

            <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg mb-5 leading-relaxed">
              ⚠️ After approval, this user will possess administrative authority over all events, student registrations, campus venues, and user management.
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="w-1/2"
                disabled={actionLoading}
                onClick={() => setApprovingApp(null)}
              >
                Cancel
              </Button>
              <Button
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                disabled={actionLoading}
                onClick={handleApproveConfirm}
              >
                {actionLoading ? 'Granting...' : 'Approve Application'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DENY CONFIRMATION DIALOG (Requirement 13)                  */}
      {/* ------------------------------------------------------------- */}
      {denyingApp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deny-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl mx-auto mb-4">
              ✕
            </div>
            <h3 id="deny-modal-title" className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
              Deny Admin Application?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
              Applicant: <strong className="text-gray-900 dark:text-white">{denyingApp.name}</strong> ({denyingApp.email})
            </p>

            <div className="mb-4">
              <label htmlFor="denial-reason-input" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Denial Reason (Optional):
              </label>
              <textarea
                id="denial-reason-input"
                rows={3}
                placeholder="Specify reason for denial (e.g., Unauthorized personnel, insufficient documentation)..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="w-full p-3 text-xs rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              The applicant will be notified that their administrator application was reviewed and denied. Their account will not receive administrator privileges.
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="w-1/2"
                disabled={actionLoading}
                onClick={() => setDenyingApp(null)}
              >
                Cancel
              </Button>
              <Button
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
                disabled={actionLoading}
                onClick={handleDenyConfirm}
              >
                {actionLoading ? 'Denying...' : 'Deny Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
