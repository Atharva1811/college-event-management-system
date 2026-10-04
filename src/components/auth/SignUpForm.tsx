import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Department } from "../../types";

const departments: Department[] = [
  "Computer Science",
  "Information Technology",
  "AI & Data Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "MBA",
  "General",
];

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<Department>("Computer Science");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the campus terms & code of conduct.");
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name,
        email,
        password,
        phone,
        department,
        role: "student", // Enforced student registration
      });

      showToast(`Account created! Welcome, ${user.name}!`, "success");
      navigate("/student/dashboard", { replace: true });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Registration failed.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md mx-auto pt-6 pb-2">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          Back to homepage
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-black text-sm flex items-center justify-center">
              C
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              CEMS Student Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Student Account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Register to RSVP for college events, track attendance, and submit feedback.
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
              Full Name <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Jordan Taylor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>
              University Email <span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="e.g. jordan@student.cems.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Department <span className="text-error-500">*</span>
              </Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="dark:bg-gray-800">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>
              Password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
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

          <div>
            <Label>
              Confirm Password <span className="text-error-500">*</span>
            </Label>
            <Input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              checked={agreeTerms}
              onChange={setAgreeTerms}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              I agree to the university event policy & student terms of service.
            </span>
          </div>

          <div className="pt-2">
            <Button
              className="w-full py-3 text-sm font-bold shadow-lg shadow-brand-500/20"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-bold text-brand-600 hover:underline dark:text-brand-400"
          >
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
