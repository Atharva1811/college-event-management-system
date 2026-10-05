import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ChevronLeftIcon } from '../../icons';
import Label from '../../components/form/Label';
import Input from '../../components/form/input/InputField';
import Button from '../../components/ui/button/Button';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activeToken = token.trim();
    if (!activeToken) {
      setError('A valid reset token is required. Please check your email recovery link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(activeToken, password);
      showToast('Password reset successfully! Please sign in with your new password.', 'success');
      navigate('/signin');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || errorObj.message || 'Password reset failed or token expired.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Set New Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose a secure new password for your CEMS account.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!tokenFromUrl && (
            <div>
              <Label>Reset Security Token <span className="text-error-500">*</span></Label>
              <Input
                type="text"
                placeholder="Paste the reset token from your recovery link"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <Label>New Password <span className="text-error-500">*</span></Label>
            <Input
              type="password"
              placeholder="Enter new password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Confirm New Password <span className="text-error-500">*</span></Label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button
            className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
            disabled={loading}
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
