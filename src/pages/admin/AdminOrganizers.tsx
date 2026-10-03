import { useEffect, useState, useCallback } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { User, Department } from '../../types';

export default function AdminOrganizers() {
  const [organizers, setOrganizers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New Organizer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDept, setNewDept] = useState<Department>('Computer Science');

  const { showToast } = useToast();

  const loadOrganizers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers({
        role: 'organizer',
        search,
      });
      setOrganizers(data.users);
    } catch (err: any) {
      showToast(err.message || 'Failed to load organizers', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadOrganizers();
  }, [loadOrganizers]);

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.isActive;
    try {
      await userService.toggleUserStatus(user._id, newStatus);
      showToast(`Organizer account ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
      await loadOrganizers();
    } catch (err: any) {
      showToast(err.message || 'Status toggle failed', 'error');
    }
  };

  const handleCreateOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const storedUsers = JSON.parse(
        localStorage.getItem('cems_users_data') || '[]'
      );
      const newOrg: User = {
        _id: `usr_org_${Date.now()}`,
        name: newName,
        email: newEmail,
        phone: newPhone,
        department: newDept,
        role: 'organizer',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      storedUsers.push(newOrg);
      localStorage.setItem('cems_users_data', JSON.stringify(storedUsers));

      showToast(`Organizer account created for ${newName}!`, 'success');
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      await loadOrganizers();
    } catch (err: any) {
      showToast(err.message || 'Creation failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Faculty Organizers Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Authorize faculty event coordinators, grant publishing permissions, and monitor active leadership.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          + Add Faculty Organizer
        </button>
      </div>

      {/* Add Organizer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Authorize New Organizer
            </h3>
            <form onSubmit={handleCreateOrganizer} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Faculty Name</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Alan Turing"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-semibold">University Email</label>
                <input
                  type="email"
                  placeholder="turing@cems.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Phone</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1 font-semibold">Department</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value as Department)}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 text-sm"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="AI & Data Science">AI & Data Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                  <option value="MBA">MBA</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-500 text-white font-bold"
                >
                  Authorize Organizer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search faculty organizers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading organizers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Faculty Organizer</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {organizers.map((org) => (
                  <tr key={org._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                    <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2.5">
                      <img
                        src={org.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                        alt={org.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{org.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{org.email}</td>
                    <td className="py-3.5 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {org.department}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{org.phone || '--'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md ${
                          org.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}
                      >
                        {org.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(org)}
                        className={`text-xs font-bold cursor-pointer hover:underline ${
                          org.isActive ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {org.isActive ? 'Suspend' : 'Activate'}
                      </button>
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
