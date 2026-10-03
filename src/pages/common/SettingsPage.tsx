import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { isMockMode } from '../../services/api';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [rsvpConfirmations, setRsvpConfirmations] = useState(true);
  const [feedbackReminders, setFeedbackReminders] = useState(true);

  const handleSave = () => {
    showToast('Preferences updated successfully.', 'success');
  };

  const isMock = isMockMode();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">
          Application Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize UI aesthetics, notifications, and review database connectivity status.
        </p>
      </div>

      {/* Theme Settings Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Appearance & Design System
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          TailAdmin responsive styling supports both pristine light and dark interfaces.
        </p>

        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-750/30 border border-gray-200/60 dark:border-gray-700/50">
          <div>
            <div className="font-semibold text-sm text-gray-800 dark:text-white">
              Current Mode: <span className="capitalize text-brand-600 dark:text-brand-400 font-bold">{theme}</span>
            </div>
            <div className="text-xs text-gray-400">
              Toggle between light and dark university themes
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            Switch to {theme === 'light' ? 'Dark 🌙' : 'Light ☀️'} Mode
          </button>
        </div>
      </div>

      {/* Database Mode Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            MongoDB Architecture Mode
          </h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isMock
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
            }`}
          >
            {isMock ? 'Mock Demo Active' : 'Live Atlas Connected'}
          </span>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {isMock
            ? 'The frontend is operating in clean Service Abstraction mode with realistic seed data and localStorage state persistence. When MongoDB Atlas is configured in backend/.env, setting VITE_USE_MOCK_DATA=false immediately switches API adapters without rewriting any UI components.'
            : 'Frontend is routing all queries directly to the Node.js Express backend and live MongoDB Atlas cluster.'}
        </p>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-600 dark:text-gray-400">
          VITE_USE_MOCK_DATA = <span className="font-bold text-brand-600">{String(isMock)}</span>
        </div>
      </div>

      {/* Notifications Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Email & Event Notifications
        </h3>

        <div className="space-y-3 text-sm">
          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-750/30 cursor-pointer">
            <div>
              <span className="font-semibold block text-gray-800 dark:text-white">Event RSVP Confirmations</span>
              <span className="text-xs text-gray-400">Receive calendar invites upon registering for campus activities</span>
            </div>
            <input
              type="checkbox"
              checked={rsvpConfirmations}
              onChange={(e) => setRsvpConfirmations(e.target.checked)}
              className="w-4 h-4 accent-brand-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-750/30 cursor-pointer">
            <div>
              <span className="font-semibold block text-gray-800 dark:text-white">Campus Digest Alerts</span>
              <span className="text-xs text-gray-400">Weekly announcement of new hackathons and cultural events</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 accent-brand-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-750/30 cursor-pointer">
            <div>
              <span className="font-semibold block text-gray-800 dark:text-white">Post-Event Review Reminders</span>
              <span className="text-xs text-gray-400">Prompt for feedback when an attended workshop concludes</span>
            </div>
            <input
              type="checkbox"
              checked={feedbackReminders}
              onChange={(e) => setFeedbackReminders(e.target.checked)}
              className="w-4 h-4 accent-brand-500 rounded"
            />
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save Notification Settings
          </button>
        </div>
      </div>
    </div>
  );
}
