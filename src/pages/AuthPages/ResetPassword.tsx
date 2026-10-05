import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import PageMeta from '../../components/common/PageMeta';
import AuthLayout from './AuthPageLayout';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = (searchParams.get('token') || '').trim();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalid, setIsTokenInvalid] = useState(!tokenFromUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tokenFromUrl) {
      setIsTokenInvalid(true);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(tokenFromUrl, password);
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { code?: string; message?: string } };
        message?: string;
      };
      const code = errorObj.response?.data?.code;
      const msg =
        errorObj.response?.data?.message ||
        errorObj.message ||
        'This password reset link is invalid or has expired.';

      if (code === 'INVALID_RESET_TOKEN' || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setIsTokenInvalid(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Reset Password | CEMS - College Event Management System"
        description="Choose a new password for your CEMS university account."
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
            {/* State 1: Invalid or Expired Token (Requirement 32) */}
            {isTokenInvalid ? (
              <div className="p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto mb-4">
                  ⚠️
                </div>
                <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                  Password Reset Link Expired
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-6 leading-relaxed">
                  This password reset link is invalid or has expired. Password recovery tokens expire after 30 minutes and can only be used once.
                </p>
                <Link
                  to="/forgot-password"
                  className="inline-block w-full py-3 text-sm font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 transition-all text-center"
                >
                  Request a New Reset Link
                </Link>
              </div>
            ) : isSuccess ? (
              /* State 2: Success State (Requirement 17 & 33) */
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mb-2">
                  Password Reset Successful
                </h2>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mb-6 leading-relaxed">
                  Your password has been updated successfully. You can now access your CEMS account with your new credentials.
                </p>
                <Link
                  to="/signin"
                  className="inline-block w-full py-3 text-sm font-bold rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/20 transition-all text-center"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              /* State 3: Active Form (Requirement 12) */
              <div>
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
                    Reset Your Password
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Choose a strong new password for your university account.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>
                      New Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label>
                      Confirm New Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
                    disabled={loading}
                  >
                    {loading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
