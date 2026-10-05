import React, { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeftIcon } from '../../icons';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
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
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || 'Failed to submit recovery request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto p-6 justify-center">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-brand-600 dark:text-gray-400 mb-8"
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
              CEMS Security
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Enter your university email and we will send you a password recovery link.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
            <div className="text-3xl mb-2">✉️</div>
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
              Reset Link Sent!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-4">
              If an account exists for <span className="font-semibold">{email}</span>, you will receive password reset instructions shortly.
            </p>
            <Link
              to="/signin"
              className="inline-block px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Return to Login
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
                placeholder="name@student.cems.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
              disabled={loading}
            >
              {loading ? 'Sending Instructions...' : 'Send Reset Instructions'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
