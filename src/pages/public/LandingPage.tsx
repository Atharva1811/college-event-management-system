import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { Event } from '../../types';

export const LandingPage: React.FC = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { events } = await eventService.getEvents({ limit: 100 });
        const counts: Record<string, number> = {};
        events.forEach((ev) => {
          counts[ev.category] = (counts[ev.category] || 0) + 1;
        });
        setCategoryCounts(counts);
        setFeaturedEvents(events.filter((e) => e.status === 'upcoming').slice(0, 6));
      } catch (err) {
        console.error('Failed to load featured events:', err);
      }
    };
    loadEvents();
  }, []);

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'organizer') return '/organizer/dashboard';
    return '/student/dashboard';
  };

  const categories = [
    { name: 'Technical', icon: '💻', desc: 'Hackathons, coding challenges, AI colloquiums & robotics' },
    { name: 'Cultural', icon: '🎭', desc: 'Music bands, theater dramas, fine arts & photography' },
    { name: 'Sports', icon: '🏆', desc: 'Cricket leagues, badminton tournaments & varsity athletic meets' },
    { name: 'Workshop', icon: '🛠️', desc: 'Full-stack bootcamp, cloud computing & design thinking' },
    { name: 'Seminar', icon: '🎙️', desc: 'Keynotes from academic pioneers, CXOs & ethical hackers' },
    { name: 'Competition', icon: '⚡', desc: 'Venture pitch showcase, chess grandmasters & robotics arena' },
  ];


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-gray-900/85 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-xl shadow-lg shadow-brand-500/25">
              C
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                CEMS
              </span>
              <span className="hidden sm:block text-[11px] font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase">
                College Event Management System
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#events" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Upcoming Events
            </a>
            <a href="#categories" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Categories
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              How It Works
            </a>
            <a href="#why-cems" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Why CEMS
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(getDashboardLink())}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all cursor-pointer"
              >
                Go to Dashboard ({role})
              </button>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/20 transition-all"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-transparent to-transparent dark:from-brand-950/20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold tracking-wide uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
              Spring Semester 2026 Registration Open
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15] mb-6">
              Discover. Register.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600">
                Participate.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mb-10">
              The unified campus platform for hackathons, cultural festivals, sports championships, workshops, and symposiums. Powered by high-concurrency MongoDB data management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/student/events"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base shadow-xl shadow-brand-500/25 transition-all text-center"
              >
                Explore All Events →
              </Link>
              <Link
                to="/signin"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold text-base border border-gray-200 dark:border-gray-700 transition-all text-center"
              >
                Student / Faculty Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section id="events" className="py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Campus Highlights
              </span>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                Upcoming Featured Events
              </h2>
            </div>
            <Link
              to="/student/events"
              className="mt-4 md:mt-0 text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View Full Calendar →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredEvents.map((event) => (
              <div
                key={event._id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-brand-500 text-white shadow-md">
                      {event.category}
                    </span>
                  </div>
                  {event.isFull && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-rose-600 text-white">
                        Full
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <span>📅 {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>📍 {event.venue}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-2 group-hover:text-brand-600 transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-6 flex-1">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/60">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Seats: <strong className="text-gray-800 dark:text-gray-200">{event.seatsRemaining}</strong> left
                    </div>
                    <Link
                      to={`/student/events/${event._id}`}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 dark:hover:bg-brand-900/60 transition-colors"
                    >
                      Details & RSVP
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Categories */}
      <section id="categories" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Versatile Programming
            </span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              Events For Every Passion
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              From high-stakes hackathons to cultural festivals, experience holistic college life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={`/student/events?category=${c.name}`}
                className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60 hover:border-brand-500 dark:hover:border-brand-500 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{c.icon}</div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {c.name}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {categoryCounts[c.name] ? `${categoryCounts[c.name]} Events` : 'Explore'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {c.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Streamlined Experience
            </span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              How CEMS Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl font-black mx-auto mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Browse & Filter
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Explore real-time listings categorized by department, schedule, venue, and remaining capacity.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl font-black mx-auto mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                One-Click RSVP
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Instant registration with automatic concurrency checks and compound unique index enforcement.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/60 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl font-black mx-auto mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Attend & Review
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Digital attendance marking, feedback ratings, and verified participation history tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why CEMS Section */}
      <section id="why-cems" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Engineered for Academic Excellence
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-2 mb-6">
                Why Universities Rely on CEMS Architecture
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Strict Role Governance</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Granular separation of privileges across Administrators, Organizers, and Students.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">MongoDB Aggregation Pipeline</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Real-time attendance analytics, departmental participation breakdowns, and $facet speed.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">TailAdmin UI & Design System</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fully responsive, accessible, clean design language with dark & light theme parity.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-200 mb-2">
                  ADBMS Presentation Highlight
                </div>
                <h3 className="text-2xl font-black mb-4">
                  Interactive MongoDB Insights
                </h3>
                <p className="text-sm text-brand-100 leading-relaxed mb-6">
                  Visit the dedicated Database Insights module to visualize live stages ($match, $lookup, $unwind, $group, $sort) powering CEMS.
                </p>
                <Link
                  to="/admin/database-insights"
                  className="inline-block px-6 py-3 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-md hover:bg-brand-50 transition-colors"
                >
                  View Database Insights →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gray-900 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black mb-6">
            Ready to participate in campus events?
          </h2>
          <p className="text-base sm:text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Create your student account or sign in with your university credentials today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm transition-all"
            >
              Register Now
            </Link>
            <Link
              to="/student/events"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm border border-gray-700 transition-all"
            >
              Browse Event Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand-500 text-white font-bold text-xs">
              C
            </div>
            <span>© 2026 College Event Management System (CEMS). Advanced Database Systems & Frontend Project.</span>
          </div>
          <div className="flex gap-6 font-semibold">
            <Link to="/signin" className="hover:text-brand-600">Sign In</Link>
            <Link to="/student/events" className="hover:text-brand-600">Events</Link>
            <Link to="/admin/database-insights" className="hover:text-brand-600">ADBMS Viva Insights</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
