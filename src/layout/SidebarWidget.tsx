import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { UserRole } from '../types';

export default function SidebarWidget() {
  const { role, switchDemoRole, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = (newRole: UserRole) => {
    switchDemoRole(newRole);
    if (newRole === 'admin') navigate('/admin/dashboard');
    else if (newRole === 'organizer') navigate('/organizer/dashboard');
    else navigate('/student/dashboard');
  };

  return (
    <div className="mx-auto mb-8 w-full max-w-60 rounded-2xl bg-gradient-to-br from-brand-50 to-indigo-50/50 p-4 border border-brand-100 text-center dark:from-white/[0.04] dark:to-brand-950/20 dark:border-gray-800">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
          Demo Role Switcher
        </span>
      </div>
      <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
        Logged in as <strong className="text-brand-600 dark:text-brand-400 capitalize">{currentUser?.name?.split(' ')[0] || role}</strong> ({role.toUpperCase()})
      </p>
      <div className="grid grid-cols-3 gap-1 mb-2.5">
        <button
          onClick={() => handleSwitch('student')}
          className={`py-1 text-[11px] font-semibold rounded-lg transition-all ${
            role === 'student'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Student
        </button>
        <button
          onClick={() => handleSwitch('organizer')}
          className={`py-1 text-[11px] font-semibold rounded-lg transition-all ${
            role === 'organizer'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Organizer
        </button>
        <button
          onClick={() => handleSwitch('admin')}
          className={`py-1 text-[11px] font-semibold rounded-lg transition-all ${
            role === 'admin'
              ? 'bg-brand-500 text-white shadow-sm'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-700'
          }`}
        >
          Admin
        </button>
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        MongoDB Aggregations in <span className="font-semibold text-brand-600 dark:text-brand-400">Admin &gt; Insights</span>
      </div>
    </div>
  );
}
