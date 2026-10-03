import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function SidebarWidget() {
  const { role, currentUser } = useAuth();

  const roleColors: Record<string, { bg: string; text: string; label: string }> = {
    admin: {
      bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
      text: 'text-rose-600',
      label: 'Administrator',
    },
    organizer: {
      bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
      text: 'text-amber-600',
      label: 'Faculty / Organizer',
    },
    student: {
      bg: 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 border-brand-200 dark:border-brand-900/40',
      text: 'text-brand-600',
      label: 'Student',
    },
  };

  const currentBadge = roleColors[role] || roleColors.student;

  return (
    <div className="mx-auto mb-8 w-full max-w-60 rounded-2xl bg-gradient-to-br from-brand-50/60 to-indigo-50/40 p-4 border border-brand-100/80 text-center dark:from-white/[0.03] dark:to-brand-950/20 dark:border-gray-800">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          CEMS Portal
        </span>
      </div>
      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
        {currentUser?.name || 'Active User'}
      </p>
      <div className="mt-1.5">
        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${currentBadge.bg}`}>
          {currentBadge.label}
        </span>
      </div>
      <div className="mt-3 pt-2.5 border-t border-brand-100/60 dark:border-gray-800 flex items-center justify-between text-[11px]">
        <span className="text-gray-500 dark:text-gray-400">Database</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Atlas
        </span>
      </div>
      <Link
        to="/profile"
        className="mt-2.5 block w-full py-1.5 text-center text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 hover:underline"
      >
        View Account Profile →
      </Link>
    </div>
  );
}
