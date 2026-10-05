import React, { useState } from 'react';
import { Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import AuthLayout from './AuthPageLayout';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { authService } from '../../services/authService';
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

export default function OrganizerApplication() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState<Department>('Computer Science');
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Please provide a brief reason / description of your organizing role (min 10 characters).');
      return;
    }

    setLoading(true);
    try {
      await authService.applyOrganizer({
        name,
        email,
        password,
        phone,
        department,
        reason,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Failed to submit organizer application. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Organizer Application | CEMS"
        description="Apply as an Event Organizer / Faculty Coordinator on the CEMS platform."
      />
      <AuthLayout>
        <div className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center">
          <Link
            to="/signin"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 dark:text-gray-400 mb-6"
          >
            <ChevronLeftIcon className="size-5 mr-1" />
            Back to sign in
          </Link>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-black text-sm flex items-center justify-center">
                C
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Faculty / Staff Portal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Organizer Application
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Apply to host, manage, and coordinate university campus events.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
              <div className="text-4xl mb-3">🎓</div>
              <h3 className="font-bold text-lg text-emerald-800 dark:text-emerald-300 mb-1">
                Application Submitted!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-4 leading-relaxed">
                Thank you, <span className="font-semibold">{name}</span>. Your application to become an event organizer has been submitted for administrative review.
                Once approved by the university admin, your account will be activated and you can sign in.
              </p>
              <Link
                to="/signin"
                className="inline-block px-5 py-2.5 text-xs font-bold rounded-xl bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/20"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>
                    Full Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Prof. / Dr. Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Faculty Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="faculty@cems.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>
                    Department <span className="text-error-500">*</span>
                  </Label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as Department)}
                    className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>
                    Role & Organizing Purpose <span className="text-error-500">*</span>
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="e.g. ACM Club Faculty Sponsor, Robotics Club Lead..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeIcon className="size-4" />
                        ) : (
                          <EyeCloseIcon className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Confirm Password <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
                  disabled={loading}
                >
                  {loading ? 'Submitting Application...' : 'Submit Organizer Application'}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                Already approved?{' '}
                <Link
                  to="/signin"
                  className="font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </AuthLayout>
    </>
  );
}
