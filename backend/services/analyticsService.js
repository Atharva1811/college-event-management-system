import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import User from '../models/User.js';

/**
 * 1. Registrations Per Event Aggregation
 * Pipeline: $match (registered) -> $group (by event) -> $lookup (from events) -> $unwind -> $project -> $sort
 */
export const getRegistrationsPerEvent = async () => {
  return await Registration.aggregate([
    {
      $match: { status: 'registered' },
    },
    {
      $group: {
        _id: '$event',
        registrationCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'events',
        localField: '_id',
        foreignField: '_id',
        as: 'eventDetails',
      },
    },
    {
      $unwind: '$eventDetails',
    },
    {
      $project: {
        _id: 1,
        title: '$eventDetails.title',
        category: '$eventDetails.category',
        capacity: '$eventDetails.capacity',
        registrationCount: 1,
        utilizationRate: {
          $round: [
            {
              $multiply: [
                { $divide: ['$registrationCount', '$eventDetails.capacity'] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
    {
      $sort: { registrationCount: -1 },
    },
  ]);
};

/**
 * 2. Events by Category Aggregation
 * Pipeline: $group (by category) -> $project -> $sort
 */
export const getEventsByCategory = async () => {
  return await Event.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
      },
    },
    {
      $project: {
        _id: 0,
        category: '$_id',
        count: 1,
        totalCapacity: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

/**
 * 3. Events by Status Aggregation
 * Pipeline: $group (by status) -> $project
 */
export const getEventsByStatus = async () => {
  return await Event.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
      },
    },
  ]);
};

/**
 * 4. Overall Attendance Statistics
 * Pipeline: $match (registered) -> $group (by attendance) -> $project
 */
export const getAttendanceStats = async (organizerId = null) => {
  const matchStage = { status: 'registered' };

  if (organizerId) {
    const orgEvents = await Event.find({ organizer: organizerId }).select('_id');
    matchStage.event = { $in: orgEvents.map((e) => e._id) };
  }

  return await Registration.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$attendance',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        attendance: '$_id',
        count: 1,
      },
    },
  ]);
};

/**
 * 5. Department Participation Aggregation
 * Pipeline: $match (registered) -> $lookup (users) -> $unwind -> $group (by department) -> $sort
 */
export const getDepartmentParticipation = async () => {
  return await Registration.aggregate([
    {
      $match: { status: 'registered' },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo',
      },
    },
    {
      $unwind: '$studentInfo',
    },
    {
      $group: {
        _id: '$studentInfo.department',
        totalRegistrations: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$attendance', 'present'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        department: '$_id',
        totalRegistrations: 1,
        presentCount: 1,
        attendanceRate: {
          $cond: [
            { $eq: ['$totalRegistrations', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$presentCount', '$totalRegistrations'] },
                    100,
                  ],
                },
                1,
              ],
            },
          ],
        },
      },
    },
    {
      $sort: { totalRegistrations: -1 },
    },
  ]);
};

/**
 * 6. Organizer Performance Statistics
 * Pipeline: $group (events by organizer) -> $lookup (users) -> $unwind -> $project -> $sort
 */
export const getOrganizerStatistics = async () => {
  return await Event.aggregate([
    {
      $group: {
        _id: '$organizer',
        totalEvents: { $sum: 1 },
        upcomingEvents: {
          $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] },
        },
        completedEvents: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalCapacity: { $sum: '$capacity' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'organizerInfo',
      },
    },
    {
      $unwind: '$organizerInfo',
    },
    {
      $project: {
        _id: 1,
        organizerName: '$organizerInfo.name',
        email: '$organizerInfo.email',
        department: '$organizerInfo.department',
        totalEvents: 1,
        upcomingEvents: 1,
        completedEvents: 1,
        totalCapacity: 1,
      },
    },
    {
      $sort: { totalEvents: -1 },
    },
  ]);
};

/**
 * 7. Monthly Registration Trend
 * Pipeline: $group (by year & month from registeredAt) -> $sort
 */
export const getMonthlyRegistrationTrends = async () => {
  return await Registration.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$registeredAt' },
          month: { $month: '$registeredAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
    {
      $project: {
        _id: 0,
        period: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            {
              $cond: [
                { $lt: ['$_id.month', 10] },
                { $concat: ['0', { $toString: '$_id.month' }] },
                { $toString: '$_id.month' },
              ],
            },
          ],
        },
        count: 1,
      },
    },
  ]);
};

/**
 * 8. Rating Distribution Aggregation
 * Pipeline: $match (rating is not null) -> $group (by rating) -> $sort
 */
export const getRatingDistribution = async (eventId = null) => {
  const matchStage = { rating: { $ne: null } };
  if (eventId) {
    matchStage.event = new mongoose.Types.ObjectId(eventId);
  }

  return await Registration.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        rating: '$_id',
        count: 1,
      },
    },
  ]);
};

/**
 * 9. Comprehensive Admin Dashboard ($facet Aggregation)
 * Uses MongoDB $facet to execute multiple multi-stage analytics pipelines in a single query pass!
 */
export const getAdminDashboardSummary = async () => {
  const [counts, analyticsFacet] = await Promise.all([
    Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'organizer' }),
      Event.countDocuments(),
      Registration.countDocuments({ status: 'registered' }),
      Event.countDocuments({ status: 'upcoming' }),
      Event.countDocuments({ status: 'completed' }),
    ]),
    Registration.aggregate([
      {
        $facet: {
          attendanceBreakdown: [
            { $match: { status: 'registered' } },
            { $group: { _id: '$attendance', count: { $sum: 1 } } },
          ],
          averageRating: [
            { $match: { rating: { $ne: null } } },
            {
              $group: {
                _id: null,
                avg: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
  ]);

  const [
    totalStudents,
    totalOrganizers,
    totalEvents,
    totalRegistrations,
    upcomingEvents,
    completedEvents,
  ] = counts;

  const attendanceFacet = analyticsFacet[0]?.attendanceBreakdown || [];
  const ratingFacet = analyticsFacet[0]?.averageRating || [];

  const presentObj = attendanceFacet.find((a) => a._id === 'present');
  const presentCount = presentObj ? presentObj.count : 0;
  const attendanceRate =
    totalRegistrations > 0
      ? Number(((presentCount / totalRegistrations) * 100).toFixed(1))
      : 0;

  const averageRating =
    ratingFacet.length > 0 ? Number(ratingFacet[0].avg.toFixed(1)) : 0;

  return {
    metrics: {
      totalStudents,
      totalOrganizers,
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      completedEvents,
      attendanceRate,
      averageRating,
    },
    categories: await getEventsByCategory(),
    departments: await getDepartmentParticipation(),
    monthlyTrends: await getMonthlyRegistrationTrends(),
    attendance: attendanceFacet,
    ratings: await getRatingDistribution(),
  };
};

/**
 * Organizer Dashboard Analytics
 */
export const getOrganizerDashboardSummary = async (organizerId) => {
  const events = await Event.find({ organizer: organizerId });
  const eventIds = events.map((e) => e._id);

  const [totalParticipants, attendanceFacet, ratingsFacet, monthlyTrends] = await Promise.all([
    Registration.countDocuments({
      event: { $in: eventIds },
      status: 'registered',
    }),
    Registration.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          status: 'registered',
        },
      },
      {
        $group: {
          _id: '$attendance',
          count: { $sum: 1 },
        },
      },
    ]),
    Registration.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          rating: { $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          total: { $sum: 1 },
        },
      },
    ]),
    Registration.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          status: 'registered',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$registeredAt' },
            month: { $month: '$registeredAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' },
                ],
              },
            ],
          },
          count: 1,
        },
      },
    ]),
  ]);

  const upcomingCount = events.filter((e) => e.status === 'upcoming').length;
  const presentObj = attendanceFacet.find((a) => a._id === 'present');
  const presentCount = presentObj ? presentObj.count : 0;
  const attendanceRate =
    totalParticipants > 0
      ? Number(((presentCount / totalParticipants) * 100).toFixed(1))
      : 0;
  const avgRating = ratingsFacet[0]?.avg ? Number(ratingsFacet[0].avg.toFixed(1)) : 0;

  return {
    metrics: {
      totalEvents: events.length,
      upcomingEvents: upcomingCount,
      totalParticipants,
      averageRating: avgRating,
      attendanceRate,
    },
    events: events.slice(0, 5),
    attendance: attendanceFacet,
    monthlyTrends,
  };
};
