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
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-gradient-to-br from-brand-950 via-slate-900 to-indigo-950 dark:bg-white/5 lg:grid">
          <div className="relative flex items-center justify-center z-1 px-8 text-center">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-brand-500 text-white font-black text-3xl flex items-center justify-center shadow-2xl shadow-brand-500/50 mb-6">
                C
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                College Event Management System
              </h2>
              <p className="text-sm text-gray-300 dark:text-white/60 leading-relaxed mb-6">
                Discover workshops, register for hackathons, and verify attendance seamlessly.
              </p>
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-md text-xs text-brand-200 border border-white/10 w-full text-left font-mono">
                <div>⚡ MongoDB Atlas ODM</div>
                <div>🛡️ Compound Unique Indexes</div>
                <div>📊 Multi-Stage Aggregation Pipeline</div>
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
