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
  const { currentUser, updateProfile } = useAuth();
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
        </div>
      </div>
    </div>
  );
}
