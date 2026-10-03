import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function Unauthorized() {
  const { role, switchDemoRole } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center text-4xl mb-6 shadow-inner">
        🛡️
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
        HTTP 403 Forbidden
      </span>
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
        Access Denied
      </h1>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        Your current account role (<strong className="uppercase">{role}</strong>) does not have authorization to view this resource.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold transition-colors"
        >
          Return Home
        </Link>
        <button
          onClick={() => {
            switchDemoRole('admin');
            window.location.href = '/admin/dashboard';
          }}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          Demo Switch to Admin Role
        </button>
      </div>
    </div>
  );
}
