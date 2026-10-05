import React, { useEffect, useState, useCallback } from 'react';
import { locationService } from '../../services/locationService';
import { useToast } from '../../context/ToastContext';
import { Location, Department } from '../../types';

const departments: Array<Department | 'All'> = [
  'All',
  'Computer Science',
  'Information Technology',
  'AI & Data Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'MBA',
  'General',
];

export default function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'pending' | 'inactive' | 'denied'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<Department | 'All'>('All');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [accessType, setAccessType] = useState<'global' | 'department'>('global');
  const [department, setDepartment] = useState<Department>('General');

  const { showToast } = useToast();

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationService.getLocations({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        department: departmentFilter !== 'All' ? departmentFilter : undefined,
        search,
      });
      setLocations(data.locations);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast(errorObj.message || 'Failed to load locations', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, departmentFilter, search, showToast]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const resetForm = () => {
    setName('');
    setBuilding('');
    setFloor('');
    setRoom('');
    setDescription('');
    setCapacity(100);
    setAccessType('global');
    setDepartment('General');
    setEditingLocation(null);
    setShowAddModal(false);
  };

  const handleOpenEdit = (loc: Location) => {
    setEditingLocation(loc);
    setName(loc.name);
    setBuilding(loc.building);
    setFloor(loc.floor || '');
    setRoom(loc.room);
    setDescription(loc.description || '');
    setCapacity(loc.capacity);
    setAccessType(loc.accessType);
    setDepartment(loc.department);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !building.trim() || !room.trim() || capacity <= 0) {
      showToast('Please provide valid name, building, room, and capacity.', 'error');
      return;
    }

    try {
      if (editingLocation) {
        await locationService.updateLocation(editingLocation._id, {
          name,
          building,
          floor,
          room,
          description,
          capacity: Number(capacity),
          accessType,
          department,
        });
        showToast(`Location "${name}" updated successfully.`, 'success');
      } else {
        await locationService.createLocation({
          name,
          building,
          floor,
          room,
          description,
          capacity: Number(capacity),
          accessType,
          department,
        });
        showToast(`Location "${name}" created and activated!`, 'success');
      }
      resetForm();
      await loadLocations();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(errorObj.response?.data?.message || errorObj.message || 'Operation failed', 'error');
    }
  };

  const handleUpdateStatus = async (loc: Location, status: 'active' | 'inactive' | 'pending' | 'denied') => {
    try {
      await locationService.updateLocationStatus(loc._id, status);
      showToast(`Location "${loc.name}" marked as ${status}.`, 'success');
      await loadLocations();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(errorObj.response?.data?.message || errorObj.message || 'Status update failed', 'error');
    }
  };

  const activeCount = locations.filter((l) => l.status === 'active').length;
  const pendingCount = locations.filter((l) => l.status === 'pending').length;
  const totalCapacity = locations
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + (l.capacity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Approved Campus Locations & Venues
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage official halls, auditoriums, and labs with conflict-free scheduling and capacity constraints.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Location
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Venues</span>
            <span className="text-lg">🏛️</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</div>
          <span className="text-xs text-emerald-600 font-medium">Available for campus event scheduling</span>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending Requests</span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
          <span className="text-xs text-gray-500">Submitted by department faculty organizers</span>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Aggregate Capacity</span>
            <span className="text-lg">👥</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{totalCapacity.toLocaleString()}</div>
          <span className="text-xs text-gray-500">Max concurrent student capacity</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl bg-white dark:bg-gray-800 p-4 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
        <div className="flex-1 w-full sm:w-auto relative">
          <input
            type="text"
            placeholder="Search venue name, building, or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3.5 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Review</option>
            <option value="inactive">Inactive</option>
            <option value="denied">Denied</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as any)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Locations Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading approved locations...</div>
        ) : locations.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">No campus locations match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50/60 dark:bg-gray-750/30 border-b border-gray-100 dark:border-gray-700/60">
                <tr>
                  <th className="py-3.5 px-4">Location Name</th>
                  <th className="py-3.5 px-4">Building & Room</th>
                  <th className="py-3.5 px-4">Max Capacity</th>
                  <th className="py-3.5 px-4">Access Scope</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {locations.map((loc) => {
                  const isPending = loc.status === 'pending';

                  return (
                    <tr key={loc._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20">
                      <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                        <div>{loc.name}</div>
                        {loc.description && (
                          <div className="text-[11px] font-normal text-gray-400 line-clamp-1">
                            {loc.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {loc.building} {loc.floor && `• ${loc.floor}`} • Room {loc.room}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-gray-900 dark:text-white">
                        {loc.capacity} seats
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            loc.accessType === 'global'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                          }`}
                        >
                          {loc.accessType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {loc.department || 'General'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md ${
                            loc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : loc.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {loc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(loc, 'active')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(loc, 'denied')}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm"
                            >
                              Deny
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEdit(loc)}
                              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            {loc.status === 'active' ? (
                              <button
                                onClick={() => handleUpdateStatus(loc, 'inactive')}
                                className="text-xs font-bold text-amber-600 hover:underline cursor-pointer ml-2"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(loc, 'active')}
                                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer ml-2"
                              >
                                Activate
                              </button>
                            )}
                          </>
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

      {/* Add / Edit Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingLocation ? 'Edit Campus Location' : 'Register New Campus Location'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Location / Venue Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APJ Abdul Kalam Auditorium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Building *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science Block"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Room Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    Maximum Capacity (Seats) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Access Scope</label>
                  <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="global">Global (All Campus)</option>
                    <option value="department">Department-Specific</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                  >
                    {departments.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  Facilities / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Audio-visual setup, projectors, smartboard, seating style..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2.5 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                >
                  {editingLocation ? 'Save Changes' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
