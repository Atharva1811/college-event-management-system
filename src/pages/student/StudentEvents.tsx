import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { eventService } from '../../services/eventService';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../context/ToastContext';
import { Event, EventCategory } from '../../types';

const categories: Array<EventCategory | 'All'> = [
  'All',
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Competition',
];

export default function StudentEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';

  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents({
        category: selectedCategory,
        status: selectedStatus,
        search,
        page,
        limit: 9,
        sort: sortField,
        order: sortOrder,
      });
      setEvents(data.events);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch events', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, search, page, sortField, sortOrder, showToast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleQuickRegister = async (eventId: string, title: string) => {
    setRegisteringId(eventId);
    try {
      await registrationService.registerForEvent(eventId);
      showToast(`Successfully registered for "${title}"!`, 'success');
      loadEvents(); // Reload to refresh seat counts
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Discover Campus Events
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search, filter, and register for student activities, conferences, and competitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
            {total} Events Found
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search title, venue, or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSearchParams({ category: e.target.value });
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="upcoming">Status: Upcoming</option>
              <option value="completed">Status: Completed</option>
              <option value="cancelled">Status: Cancelled</option>
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={`${sortField}_${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('_');
                setSortField(f);
                setSortOrder(o as 'asc' | 'desc');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="date_asc">Date: Earliest First</option>
              <option value="date_desc">Date: Latest First</option>
              <option value="title_asc">Title: A to Z</option>
              <option value="capacity_desc">Capacity: Highest</option>
            </select>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-gray-400 font-semibold mr-1">Quick Filter:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedCategory(c);
                setSearchParams({ category: c });
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c
                  ? 'bg-brand-500 text-white font-bold shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200/50 dark:border-gray-700/50"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            No Events Match Your Filters
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Try adjusting your search query, status, or category criteria.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setSelectedStatus('All');
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const orgName =
              typeof event.organizer === 'object'
                ? event.organizer.name
                : 'Faculty Coordinator';

            const isExpired = new Date() > new Date(event.registrationDeadline);
            const canRegister =
              event.status === 'upcoming' && !event.isFull && !isExpired;

            return (
              <div
                key={event._id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* Banner & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-brand-500 text-white shadow-md">
                      {event.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        event.status === 'upcoming'
                          ? 'bg-emerald-600 text-white'
                          : event.status === 'completed'
                          ? 'bg-gray-700 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  {event.isFull && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-rose-600 text-white shadow">
                        Full
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <span>📅 {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>⏰ {event.time}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 mb-1.5 group-hover:text-brand-600 transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                    {event.description}
                  </p>

                  <div className="text-xs space-y-1 mb-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-gray-600 dark:text-gray-300">
                    <div className="truncate">📍 <span className="font-medium">{event.venue}</span></div>
                    <div className="truncate">👤 Host: <span className="font-medium">{orgName}</span></div>
                    <div className="flex items-center justify-between text-xs font-semibold pt-1">
                      <span>Available Seats:</span>
                      <span
                        className={
                          event.seatsRemaining && event.seatsRemaining < 5
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-gray-900 dark:text-white'
                        }
                      >
                        {event.seatsRemaining} / {event.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Link
                      to={`/student/events/${event._id}`}
                      className="flex-1 py-2.5 rounded-xl text-center text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      Details
                    </Link>

                    {canRegister ? (
                      <button
                        onClick={() => handleQuickRegister(event._id, event.title)}
                        disabled={registeringId === event._id}
                        className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {registeringId === event._id ? 'Joining...' : 'Register'}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs font-semibold cursor-not-allowed"
                      >
                        {event.status === 'completed'
                          ? 'Ended'
                          : event.status === 'cancelled'
                          ? 'Cancelled'
                          : isExpired
                          ? 'Deadline Passed'
                          : 'Full'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing Page <strong className="text-gray-900 dark:text-white">{page}</strong> of{' '}
            <strong className="text-gray-900 dark:text-white">{totalPages}</strong> ({total} total items)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
