import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, role, logout } = useAuth();
  const navigate = useNavigate();

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleSignOut = () => {
    closeDropdown();
    logout();
    navigate("/signin", { replace: true, state: {} });
  };

  const displayName = currentUser?.name || "Student User";
  const displayEmail = currentUser?.email || "student@cems.edu";
  const displayAvatar = currentUser?.avatar || "/images/user/owner.jpg";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400 group"
      >
        <span className="mr-3 overflow-hidden rounded-full h-10 w-10 border border-gray-200 dark:border-gray-700">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback placeholder
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
            }}
          />
        </span>

        <div className="hidden text-left sm:block mr-2">
          <span className="block font-semibold text-theme-sm text-gray-800 dark:text-white leading-tight">
            {displayName}
          </span>
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {role}
          </span>
        </div>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-50"
      >
        <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
          <span className="block font-semibold text-gray-800 text-theme-sm dark:text-white">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400 truncate">
            {displayEmail}
          </span>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
              {role}
            </span>
            {currentUser?.department && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {currentUser.department}
              </span>
            )}
          </div>
        </div>

        <ul className="flex flex-col gap-1 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
          <li>
            <Link
              to="/profile"
              onClick={closeDropdown}
              className="flex items-center gap-2.5 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              onClick={closeDropdown}
              className="flex items-center gap-2.5 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 mt-2 font-medium text-rose-600 rounded-lg group text-theme-sm hover:bg-rose-50 dark:hover:bg-rose-950/20 dark:text-rose-400 transition-colors w-full text-left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </Dropdown>
    </div>
  );
}
