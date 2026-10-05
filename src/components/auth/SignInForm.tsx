import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      showToast(`Welcome back, ${user.name}!`, "success");

      // Check for redirect location
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      // Role-based redirection
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "organizer") {
        navigate("/organizer/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Failed to sign in. Please verify your credentials.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-8 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          Back to homepage
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-black text-sm flex items-center justify-center">
              C
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              College Event Management System
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sign In to CEMS
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Access your university event dashboard and registrations.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>
              University Email <span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="Enter your university email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeIcon className="size-5" />
                ) : (
                  <EyeCloseIcon className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isChecked}
                onChange={setIsChecked}
              />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Remember me
              </span>
            </div>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
            >
              Forgot password?
            </Link>
          </div>

          <div>
            <Button
              className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Don't have a student account yet?{" "}
            <Link
              to="/signup"
              className="font-bold text-brand-600 hover:underline dark:text-brand-400"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
