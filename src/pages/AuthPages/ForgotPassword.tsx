import React, { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeftIcon } from '../../icons';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import PageMeta from '../../components/common/PageMeta';
import AuthLayout from './AuthPageLayout';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your university email address.');
      setLoading(false);
      return;
    }

    try {
      await authService.forgotPassword(trimmedEmail);
      setSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || 'Failed to submit recovery request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Forgot Password | CEMS - College Event Management System"
        description="Reset your CEMS password using your registered university email address."
      />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="w-full max-w-md pt-8 mx-auto">
            <Link
              to="/signin"
              className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
            >
              <ChevronLeftIcon className="size-5 mr-1" />
              Back to sign in
            </Link>
          </div>

          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-black text-sm flex items-center justify-center">
                  C
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  CEMS Security
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Forgot Password
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter your registered email address and we'll send you a password reset link.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <div className="text-3xl mb-2">✉️</div>
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  Reset Link Sent
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-4 leading-relaxed">
                  If an account exists with this email, a password reset link has been sent. Please check your inbox and spam folder.
                </p>
                <Link
                  to="/signin"
                  className="inline-block px-5 py-2.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 transition-all"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>
                    University Email Address <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="name@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
                  disabled={loading}
                >
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Remember your password?{' '}
                <Link
                  to="/signin"
                  className="font-bold text-brand-600 hover:underline dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
