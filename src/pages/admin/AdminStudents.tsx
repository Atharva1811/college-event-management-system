import React, { useEffect, useState, useCallback } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { User, Department } from '../../types';

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

export default function AdminStudents() {
  const [students, setStudents] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState<Department>('Computer Science');

  const { showToast } = useToast();

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        role: 'student',
        department: selectedDept,
        search,
        page,
        limit: 10,
      });
      setStudents(data.users);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedDept, search, page, showToast]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleSuspend = async (user: User) => {
    const reason = window.prompt(`Enter suspension reason for student "${user.name}":`, 'Violation of university event conduct policy');
    if (reason === null) return;
    try {
      await userService.suspendUser(user._id, reason);
      showToast(`Student "${user.name}" has been suspended.`, 'success');
      await loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Suspension failed', 'error');
    }
  };

  const handleReactivate = async (user: User) => {
    if (!window.confirm(`Reactivate account for student "${user.name}"?`)) return;
    try {
      await userService.reactivateUser(user._id);
      showToast(`Student "${user.name}" account reactivated.`, 'success');
      await loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Reactivation failed', 'error');
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Permanently delete account for "${user.name}"?`)) return;
    try {
      await userService.deleteUser(user._id);
      showToast(`Student "${user.name}" deleted.`, 'success');
      await loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Deletion failed', 'error');
    }
  };

  const openEdit = (user: User) => {
    setEditingStudent(user);
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditDept(user.department || 'Computer Science');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await userService.updateUser(editingStudent._id, {
        name: editName,
        phone: editPhone,
        department: editDept,
      });
      showToast(`Updated student "${editName}" successfully.`, 'success');
      setEditingStudent(null);
      await loadStudents();
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Student User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Directory of registered students, account status, and department affiliations.
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
          {total} Total Enrolled Students
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-gray-50/50 dark:bg-gray-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-400">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Edit Student Record
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Department</label>
                <select
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value as Department)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                >
                  {departments
                    .filter((d) => d !== 'All')
                    .map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-lg border text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-500 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading students...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2.5">
                      <img
                        src={student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={student.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{student.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{student.email}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {student.department}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {student.phone || '--'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md ${
                          student.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : student.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {student.status === 'suspended' ? 'Suspended' : student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString()
                        : 'Sep 2025'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(student)}
                        className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      {student.status === 'suspended' ? (
                        <button
                          onClick={() => handleReactivate(student)}
                          className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(student)}
                          className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(student)}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-30"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
