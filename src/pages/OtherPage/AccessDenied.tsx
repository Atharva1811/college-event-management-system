import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const suspensionReason =
    sessionStorage.getItem('cems_suspension_reason') ||
    'Your account has been suspended by the administrator.';

  const handleLogout = () => {
    logout();
    sessionStorage.removeItem('cems_suspension_reason');
    navigate('/signin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
      <div className="w-24 h-24 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-5xl mb-6 shadow-inner border border-rose-200 dark:border-rose-900/50">
        🚫
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
        Account Suspended
      </span>
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
        ACCESS DENIED
      </h1>
      <p className="max-w-lg text-base text-gray-700 dark:text-gray-300 font-medium mb-3 leading-relaxed">
        {suspensionReason}
      </p>
      <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 mb-8">
        Please contact the campus system administrator if you believe this is a mistake or to request account reactivation.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleLogout}
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
        >
          Logout & Return to Sign In
        </button>
      </div>
    </div>
  );
}
