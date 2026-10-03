import { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { DatabaseInsightsData } from '../../types';

interface PipelineDemo {
  id: string;
  name: string;
  stages: Array<{
    operator: '$match' | '$lookup' | '$unwind' | '$group' | '$sort' | '$project' | '$facet';
    description: string;
    code: string;
  }>;
  explanation: string;
  vivaQuestion: string;
}

const pipelines: PipelineDemo[] = [
  {
    id: 'reg-per-event',
    name: '1. Registrations Per Event & Utilization',
    stages: [
      {
        operator: '$match',
        description: 'Filters only active registrations (excludes soft-cancelled)',
        code: `{ $match: { status: "registered" } }`,
      },
      {
        operator: '$group',
        description: 'Groups documents by event ObjectId and counts occurrences',
        code: `{ $group: { _id: "$event", registrationCount: { $sum: 1 } } }`,
      },
      {
        operator: '$lookup',
        description: 'Performs foreign collection join: registrations.event -> events._id',
        code: `{ $lookup: { from: "events", localField: "_id", foreignField: "_id", as: "eventDetails" } }`,
      },
      {
        operator: '$unwind',
        description: 'Deconstructs single-element eventDetails array into a document object',
        code: `{ $unwind: "$eventDetails" }`,
      },
      {
        operator: '$project',
        description: 'Computes utilizationRate percentage using $multiply and $divide',
        code: `{ $project: { title: "$eventDetails.title", category: "$eventDetails.category", capacity: "$eventDetails.capacity", registrationCount: 1, utilizationRate: { $round: [{ $multiply: [{ $divide: ["$registrationCount", "$eventDetails.capacity"] }, 100] }, 1] } } }`,
      },
      {
        operator: '$sort',
        description: 'Orders results descending by student turnout',
        code: `{ $sort: { registrationCount: -1 } }`,
      },
    ],
    explanation:
      'Demonstrates multi-collection join ($lookup) followed by array deconstruction ($unwind) and mathematical field projection ($project).',
    vivaQuestion:
      'Q: Why is $unwind needed after $lookup? A: $lookup outputs an array field even for 1-to-1 relationships. $unwind flattens the array so properties can be accessed directly without indexing array elements.',
  },
  {
    id: 'events-by-category',
    name: '2. Events by Category & Total Capacity',
    stages: [
      {
        operator: '$group',
        description: 'Groups events by category enum, summing document counts and capacities',
        code: `{ $group: { _id: "$category", count: { $sum: 1 }, totalCapacity: { $sum: "$capacity" } } }`,
      },
      {
        operator: '$project',
        description: 'Reshapes output document replacing _id with named category field',
        code: `{ $project: { _id: 0, category: "$_id", count: 1, totalCapacity: 1 } }`,
      },
      {
        operator: '$sort',
        description: 'Sorts categories by frequency in descending order',
        code: `{ $sort: { count: -1 } }`,
      },
    ],
    explanation:
      'Aggregates events collection without joins, demonstrating accumulation operators ($sum: 1 and $sum: "$capacity").',
    vivaQuestion:
      'Q: How does $group differ from SQL GROUP BY? A: Both perform document aggregation, but MongoDB allows nested document structures and accumulator operators ($sum, $avg, $push, $addToSet) directly within the grouping stage.',
  },
  {
    id: 'events-by-status',
    name: '3. Events by Lifecycle Status',
    stages: [
      {
        operator: '$group',
        description: 'Partitions events by lifecycle status (upcoming, completed, cancelled)',
        code: `{ $group: { _id: "$status", count: { $sum: 1 } } }`,
      },
      {
        operator: '$project',
        description: 'Renames _id to status attribute',
        code: `{ $project: { _id: 0, status: "$_id", count: 1 } }`,
      },
    ],
    explanation:
      'Simple partitioning stage used for status distribution visualization and state management analytics.',
    vivaQuestion:
      'Q: What is the benefit of indexing the status field? A: Creating an index on status ({ status: 1 }) allows MongoDB to utilize an index scan instead of a collection scan (COLLSCAN).',
  },
  {
    id: 'attendance-stats',
    name: '4. Overall Attendance Verification Status',
    stages: [
      {
        operator: '$match',
        description: 'Filters for valid active registrations',
        code: `{ $match: { status: "registered" } }`,
      },
      {
        operator: '$group',
        description: 'Groups attendance statuses (present, absent, pending)',
        code: `{ $group: { _id: "$attendance", count: { $sum: 1 } } }`,
      },
      {
        operator: '$project',
        description: 'Reshapes attendance count metrics',
        code: `{ $project: { _id: 0, attendance: "$_id", count: 1 } }`,
      },
    ],
    explanation:
      'Counts student check-ins to monitor campus engagement rates and determine absenteeism.',
    vivaQuestion:
      'Q: What compound index helps this query? A: { status: 1, attendance: 1 } provides an index-covered query.',
  },
  {
    id: 'dept-participation',
    name: '5. Department Participation & Attendance Yield',
    stages: [
      {
        operator: '$match',
        description: 'Considers registered documents only',
        code: `{ $match: { status: "registered" } }`,
      },
      {
        operator: '$lookup',
        description: 'Joins student record from users collection',
        code: `{ $lookup: { from: "users", localField: "student", foreignField: "_id", as: "studentInfo" } }`,
      },
      {
        operator: '$unwind',
        description: 'Deconstructs studentInfo array',
        code: `{ $unwind: "$studentInfo" }`,
      },
      {
        operator: '$group',
        description: 'Groups by studentInfo.department with conditional attendance summation',
        code: `{ $group: { _id: "$studentInfo.department", totalRegistrations: { $sum: 1 }, presentCount: { $sum: { $cond: [{ $eq: ["$attendance", "present"] }, 1, 0] } } } }`,
      },
      {
        operator: '$project',
        description: 'Computes department attendance percentage rate',
        code: `{ $project: { department: "$_id", totalRegistrations: 1, presentCount: 1, attendanceRate: { $round: [{ $multiply: [{ $divide: ["$presentCount", "$totalRegistrations"] }, 100] }, 1] } } }`,
      },
      {
        operator: '$sort',
        description: 'Ranks departments from highest to lowest turnout',
        code: `{ $sort: { totalRegistrations: -1 } }`,
      },
    ],
    explanation:
      'Crucial ADBMS demonstration: Uses $cond inside an accumulator to perform inline conditional aggregation during grouping.',
    vivaQuestion:
      'Q: What does $cond do in MongoDB aggregation? A: It evaluates a boolean condition (IF-THEN-ELSE). Here: If attendance === "present", return 1, else 0, allowing simultaneous counts of total and present students in 1 pass.',
  },
  {
    id: 'organizer-stats',
    name: '6. Faculty Organizer Performance Statistics',
    stages: [
      {
        operator: '$group',
        description: 'Groups events collection by organizer ObjectId',
        code: `{ $group: { _id: "$organizer", totalEvents: { $sum: 1 }, totalCapacity: { $sum: "$capacity" } } }`,
      },
      {
        operator: '$lookup',
        description: 'Joins faculty profile details from users collection',
        code: `{ $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "organizerInfo" } }`,
      },
      {
        operator: '$unwind',
        description: 'Flattens organizer profile array',
        code: `{ $unwind: "$organizerInfo" }`,
      },
      {
        operator: '$project',
        description: 'Extracts organizer name, email, department, and event count',
        code: `{ $project: { organizerName: "$organizerInfo.name", email: "$organizerInfo.email", department: "$organizerInfo.department", totalEvents: 1, totalCapacity: 1 } }`,
      },
      {
        operator: '$sort',
        description: 'Sorts by total events hosted descending',
        code: `{ $sort: { totalEvents: -1 } }`,
      },
    ],
    explanation:
      'Analyzes administrative workload and faculty event contribution across departments.',
    vivaQuestion:
      'Q: Why is organizer an ObjectId reference instead of embedding the user inside each event? A: Organizers can change their profile or phone. Referencing prevents redundant data anomaly updates across dozens of event documents.',
  },
  {
    id: 'monthly-trends',
    name: '7. Monthly Registration Trend Extraction',
    stages: [
      {
        operator: '$group',
        description: 'Extracts $year and $month from registeredAt timestamp date field',
        code: `{ $group: { _id: { year: { $year: "$registeredAt" }, month: { $month: "$registeredAt" } }, count: { $sum: 1 } } }`,
      },
      {
        operator: '$sort',
        description: 'Sorts chronologically by year and month',
        code: `{ $sort: { "_id.year": 1, "_id.month": 1 } }`,
      },
      {
        operator: '$project',
        description: 'Formats period string (YYYY-MM)',
        code: `{ $project: { _id: 0, period: { $concat: [{ $toString: "$_id.year" }, "-", { $toString: "$_id.month" }] }, count: 1 } }`,
      },
    ],
    explanation:
      'Demonstrates MongoDB native Date Expression Operators ($year, $month) and String Concat ($concat) for time-series extraction.',
    vivaQuestion:
      'Q: How does MongoDB handle timestamps? A: MongoDB stores BSON UTC Date as a 64-bit integer representing milliseconds since Unix epoch, enabling high-performance date math operators.',
  },
  {
    id: 'rating-dist',
    name: '8. Event Satisfaction Rating Distribution',
    stages: [
      {
        operator: '$match',
        description: 'Filters out null ratings (sessions pending review)',
        code: `{ $match: { rating: { $ne: null } } }`,
      },
      {
        operator: '$group',
        description: 'Groups by star rating (1 to 5) and tallies count',
        code: `{ $group: { _id: "$rating", count: { $sum: 1 } } }`,
      },
      {
        operator: '$sort',
        description: 'Sorts ascending from 1 to 5 stars',
        code: `{ $sort: { _id: 1 } }`,
      },
    ],
    explanation:
      'Filters non-null numeric reviews and tabulates distribution across student ratings.',
    vivaQuestion:
      'Q: Can an index filter null values efficiently? A: Yes, a sparse index ({ rating: 1 }, { sparse: true }) only contains entries for documents that have the indexed field, saving storage.',
  },
  {
    id: 'admin-facet',
    name: '9. Multi-Facet Dashboard Analytics ($facet)',
    stages: [
      {
        operator: '$facet',
        description: 'Executes multiple independent sub-pipelines in parallel in a single database round-trip',
        code: `{ $facet: { attendanceBreakdown: [{ $match: { status: "registered" } }, { $group: { _id: "$attendance", count: { $sum: 1 } } }], averageRating: [{ $match: { rating: { $ne: null } } }, { $group: { _id: null, avg: { $avg: "$rating" } } }] } }`,
      },
    ],
    explanation:
      'Advanced MongoDB optimization: $facet processes multiple aggregation pipelines within a single stage on the same input documents, avoiding multiple network queries!',
    vivaQuestion:
      'Q: Why is $facet considered an advanced ADBMS feature? A: It avoids running multiple round trips to the server. You can generate multiple summary metrics (breakdowns, averages, top-N) within a single pass over the collection.',
  },
];

export default function AdminDatabaseInsights() {
  const [insights, setInsights] = useState<DatabaseInsightsData | null>(null);
  const [activePipeline, setActivePipeline] = useState<string>('reg-per-event');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const data = await analyticsService.getDatabaseInsights();
        setInsights(data);
      } catch (err) {
        console.error('Failed to load database insights:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, []);

  const currentPipeline = pipelines.find((p) => p.id === activePipeline) || pipelines[0];

  const getStageBadgeColor = (op: string) => {
    switch (op) {
      case '$match':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case '$lookup':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case '$unwind':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case '$group':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case '$sort':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case '$project':
        return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      case '$facet':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && !insights) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500">
        Loading MongoDB Database Insights & Aggregations...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-brand-600 text-white shadow-xl">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md">
            ADBMS Presentation Module
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md">
            MongoDB Atlas & Mongoose ODM
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black mb-2">
          Database Architecture & Aggregation Pipeline Explorer
        </h1>
        <p className="text-sm sm:text-base text-emerald-100 max-w-3xl leading-relaxed">
          Interactive demonstration platform for Advanced Database Management Systems (ADBMS).
          Inspect schema collections, indexes, ObjectId reference joins, and 9 production-grade aggregation pipelines.
        </p>
      </div>

      {/* 3 Core Collections Summary */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
          <span>📁 MongoDB Collections & Schemas</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights?.collections.map((col) => (
            <div
              key={col.name}
              className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    Collection
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                    {col.count} Documents
                  </span>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
                  db.{col.name}
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Indexes Defined ({col.indexes.length}):
                    </span>
                    <ul className="space-y-1 text-gray-500 dark:text-gray-400">
                      {col.indexes.map((idx, i) => (
                        <li key={i} className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-emerald-500">⚡</span> {idx}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Schema Attributes:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {col.schemaFields.map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400">
                Primary Key: <code className="font-bold text-brand-600">_id (ObjectId)</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ADBMS Key Theory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40">
          <h4 className="font-bold text-brand-900 dark:text-brand-200 text-sm mb-1">
            🔗 Referencing vs Embedding
          </h4>
          <p className="text-xs text-brand-700 dark:text-brand-300 leading-relaxed">
            CEMS references Users from Registrations and Events via <strong>ObjectId</strong>. If we embedded 500 registrations into each event document, it would violate the 16MB BSON limit and cause high document write locking.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-1">
            🛡️ Compound Unique Index
          </h4>
          <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
            <code>Registration.index({`{ student: 1, event: 1 }`}, {`{ unique: true }`})</code>. Enforces database-level uniqueness so a student cannot have duplicate active admissions.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm mb-1">
            ⚡ Aggregation Pipeline
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
            Multi-stage data transformation framework. Documents pass through sequential stages (Filter → Group → Lookup → Project → Sort) natively executed in the database engine.
          </p>
        </div>
      </div>

      {/* Interactive 9 Aggregations Explorer */}
      <div className="rounded-3xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60 shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Live Demonstration
          </span>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            Interactive MongoDB Aggregation Pipelines
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select an aggregation pipeline to visualize each execution stage, inspect Mongoose query syntax, and review the live transformed result.
          </p>
        </div>

        {/* Pipeline Tab Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePipeline(p.id)}
              className={`p-3 rounded-xl text-left text-xs font-bold transition-all border cursor-pointer ${
                activePipeline === p.id
                  ? 'bg-brand-500 text-white border-brand-500 shadow-md'
                  : 'bg-gray-50 dark:bg-gray-750/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Selected Pipeline Viewer */}
        <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                {currentPipeline.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {currentPipeline.explanation}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 self-start">
              {currentPipeline.stages.length} Pipeline Stages
            </span>
          </div>

          {/* Sequential Stage Diagram */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              Stage by Stage Transformation Pipeline
            </span>

            <div className="space-y-3">
              {currentPipeline.stages.map((stage, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-black">
                      {idx + 1}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border ${getStageBadgeColor(
                        stage.operator
                      )}`}
                    >
                      {stage.operator}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {stage.description}
                    </span>
                  </div>

                  <pre className="p-2.5 rounded-lg bg-gray-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                    <code>{stage.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Viva Presentation Prep Box */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block mb-1">
              💡 Examiner Viva Explanation:
            </span>
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
              {currentPipeline.vivaQuestion}
            </p>
          </div>

          {/* Live Result Output */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
              Aggregation Pipeline Output (Real Live Data)
            </span>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-72">
              <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200 leading-relaxed">
                {activePipeline === 'reg-per-event' &&
                  JSON.stringify(insights?.aggregations.registrationsPerEvent, null, 2)}
                {activePipeline === 'events-by-category' &&
                  JSON.stringify(insights?.aggregations.eventsByCategory, null, 2)}
                {activePipeline === 'events-by-status' &&
                  JSON.stringify(insights?.aggregations.eventsByStatus, null, 2)}
                {activePipeline === 'attendance-stats' &&
                  JSON.stringify(insights?.aggregations.attendanceStats, null, 2)}
                {activePipeline === 'dept-participation' &&
                  JSON.stringify(insights?.aggregations.departmentParticipation, null, 2)}
                {activePipeline === 'organizer-stats' &&
                  JSON.stringify(insights?.aggregations.organizerStatistics, null, 2)}
                {activePipeline === 'monthly-trends' &&
                  JSON.stringify(insights?.aggregations.monthlyTrends, null, 2)}
                {activePipeline === 'rating-dist' &&
                  JSON.stringify(insights?.aggregations.ratingDistribution, null, 2)}
                {activePipeline === 'admin-facet' &&
                  JSON.stringify(
                    {
                      attendanceBreakdown: insights?.aggregations.attendanceStats,
                      ratingDistribution: insights?.aggregations.ratingDistribution,
                    },
                    null,
                    2
                  )}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
