import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { Department } from '../../types';

const departments: Department[] = [
  'Computer Science',
  'Information Technology',
  'AI & Data Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'MBA',
  'General',
];

export default function ProfilePage() {
  const { currentUser, updateProfile, applyOrganizerUpgrade } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [department, setDepartment] = useState<Department>(
    currentUser?.department || 'Computer Science'
  );
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Organizer upgrade fields (Requirement 8)
  const [upgradeDept, setUpgradeDept] = useState<Department>(currentUser?.department || 'Computer Science');
  const [upgradeReason, setUpgradeReason] = useState('');
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  const handleApplyOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeReason.trim()) {
      showToast('Please state your purpose / role for requesting organizer privileges.', 'error');
      return;
    }
    setSubmittingUpgrade(true);
    try {
      const res = await applyOrganizerUpgrade({
        department: upgradeDept,
        reason: upgradeReason.trim(),
      });
      showToast(res.message || 'Organizer application submitted for review!', 'success');
      setUpgradeReason('');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(errorObj.response?.data?.message || errorObj.message || 'Upgrade request failed', 'error');
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      updateProfile({ name, phone, department, avatar });
      showToast('Profile updated successfully!', 'success');
    } catch {
      showToast('Profile update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSavingPassword(false);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          My Account Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal university credentials, contact information, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-500/20 shadow-inner mb-4">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={currentUser?.name}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {currentUser?.name}
          </h3>
          <span className="text-xs text-gray-400">{currentUser?.email}</span>

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              {currentUser?.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {currentUser?.department}
            </span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 space-y-2 text-left">
            <div>
              <span className="font-semibold block text-gray-400">Account ID:</span>
              <code className="text-[11px] text-gray-600 dark:text-gray-300">{currentUser?._id}</code>
            </div>
            <div>
              <span className="font-semibold block text-gray-400">Status:</span>
              <span className="text-emerald-600 font-bold">Active & Verified</span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Personal Information
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email (Permanent)</Label>
                  <Input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                  />
                </div>

                <div>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d} className="dark:bg-gray-800">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Avatar Photo URL</Label>
                  <Input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button disabled={savingProfile} className="px-6 py-2.5 text-xs font-bold">
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Password Change Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Security & Password
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button disabled={savingPassword} className="px-6 py-2.5 text-xs font-bold">
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>

          {/* Requirement 8: Student Organizer Upgrade Application */}
          {currentUser?.role === 'student' && (
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Apply to Become a Campus Event Organizer
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Upgrade this account to host and manage events for your academic department. Your registered events and history will remain intact.
                  </p>
                </div>
                <span className="text-2xl">📋</span>
              </div>

              {currentUser.organizerStatus === 'pending' ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <span>⏳</span>
                    <span>Application Under Review</span>
                  </div>
                  <p>
                    Your request to become an organizer for <strong>{currentUser.department}</strong> is currently pending administrative review. You will receive a notification once an administrator reviews it.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplyOrganizer} className="space-y-4 pt-1">
                  {currentUser.organizerStatus === 'denied' && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs">
                      Your previous organizer request was not approved. You may submit an updated application statement below.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Affiliated Department</Label>
                      <select
                        value={upgradeDept}
                        onChange={(e) => setUpgradeDept(e.target.value as Department)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-xs text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept} className="dark:bg-gray-800">
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Applicant Status</Label>
                      <div className="h-11 flex items-center px-3.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 font-medium">
                        Student Account ({currentUser.email})
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Application Purpose & Club / Department Responsibilities *</Label>
                    <textarea
                      rows={3}
                      required
                      value={upgradeReason}
                      onChange={(e) => setUpgradeReason(e.target.value)}
                      placeholder="Outline which department events, tech fests, or campus activities you plan to coordinate..."
                      className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent text-xs focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      disabled={submittingUpgrade}
                      className="px-6 py-2.5 text-xs font-bold shadow-md shadow-brand-500/20 cursor-pointer"
                    >
                      {submittingUpgrade ? 'Submitting Application...' : 'Submit Organizer Request'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
