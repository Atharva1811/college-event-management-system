import GridShape from "../../components/common/GridShape";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="relative items-center justify-center hidden w-full h-full lg:w-1/2 overflow-hidden bg-gradient-to-br from-brand-950 via-slate-900 to-indigo-950 dark:bg-white/5 lg:flex">
          {/* <!-- ===== Background Decorative Grid Shape ===== --> */}
          <GridShape />
          <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white font-black text-3xl flex items-center justify-center shadow-2xl shadow-brand-500/40 mb-6 ring-4 ring-white/10 select-none">
              C
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight mb-2">
              College Event Management System
            </h2>
            <p className="text-sm text-gray-300 dark:text-white/70 leading-relaxed mb-6 max-w-sm mx-auto">
              Discover workshops, register for hackathons, and verify attendance seamlessly.
            </p>
            <div className="w-full max-w-sm rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-4 text-left shadow-lg">
              <div className="space-y-2.5 font-mono text-xs text-brand-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">⚡</span>
                  <span className="font-semibold text-white/90">MongoDB Atlas ODM</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">🛡️</span>
                  <span className="font-semibold text-white/90">Compound Unique Indexes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">📊</span>
                  <span className="font-semibold text-white/90">Multi-Stage Aggregation Pipeline</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
