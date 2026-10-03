import * as analyticsService from '../services/analyticsService.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import { isConnected } from '../config/db.js';

export const getAdminAnalytics = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const summary = await analyticsService.getAdminDashboardSummary();
    res.status(200).json({
      success: true,
      message: 'Admin analytics fetched successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizerAnalytics = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const summary = await analyticsService.getOrganizerDashboardSummary(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Organizer analytics fetched successfully',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentAnalytics = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const studentId = req.user._id;
    const [totalRegistrations, attendedCount, feedbackGivenCount] = await Promise.all([
      Registration.countDocuments({ student: studentId, status: 'registered' }),
      Registration.countDocuments({
        student: studentId,
        status: 'registered',
        attendance: 'present',
      }),
      Registration.countDocuments({
        student: studentId,
        rating: { $ne: null },
      }),
    ]);

    const upcomingEvents = await Event.countDocuments({ status: 'upcoming' });

    res.status(200).json({
      success: true,
      message: 'Student analytics fetched successfully',
      data: {
        totalRegistrations,
        attendedCount,
        feedbackGivenCount,
        upcomingEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEventAnalytics = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { eventId } = req.params;
    const [event, attendanceStats, ratingDist] = await Promise.all([
      Event.findById(eventId),
      Registration.aggregate([
        { $match: { event: eventId, status: 'registered' } },
        { $group: { _id: '$attendance', count: { $sum: 1 } } },
      ]),
      analyticsService.getRatingDistribution(eventId),
    ]);

    res.status(200).json({
      success: true,
      message: 'Event analytics fetched successfully',
      data: {
        event,
        attendanceStats,
        ratingDistribution: ratingDist,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDatabaseInsights = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const [
      usersCount,
      eventsCount,
      registrationsCount,
      registrationsPerEvent,
      eventsByCategory,
      eventsByStatus,
      attendanceStats,
      departmentParticipation,
      organizerStatistics,
      monthlyTrends,
      ratingDistribution,
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments(),
      analyticsService.getRegistrationsPerEvent(),
      analyticsService.getEventsByCategory(),
      analyticsService.getEventsByStatus(),
      analyticsService.getAttendanceStats(),
      analyticsService.getDepartmentParticipation(),
      analyticsService.getOrganizerStatistics(),
      analyticsService.getMonthlyRegistrationTrends(),
      analyticsService.getRatingDistribution(),
    ]);

    res.status(200).json({
      success: true,
      message: 'Database insights and aggregation metrics fetched successfully',
      data: {
        collections: [
          {
            name: 'users',
            count: usersCount,
            indexes: ['_id_', 'email_1 (unique)', 'role_1', 'department_1', 'role_1_department_1'],
            schemaFields: ['_id', 'name', 'email', 'password (hashed)', 'role', 'phone', 'department', 'avatar', 'isActive', 'timestamps'],
          },
          {
            name: 'events',
            count: eventsCount,
            indexes: ['_id_', 'date_1', 'category_1', 'status_1', 'organizer_1', 'status_1_date_1', 'title_text_description_text'],
            schemaFields: ['_id', 'title', 'description', 'category', 'date', 'time', 'venue', 'organizer (ref User)', 'capacity', 'status', 'image', 'registrationDeadline', 'timestamps'],
          },
          {
            name: 'registrations',
            count: registrationsCount,
            indexes: ['_id_', 'student_1_event_1 (unique compound)', 'event_1_status_1', 'student_1_status_1', 'attendance_1', 'rating_1'],
            schemaFields: ['_id', 'student (ref User)', 'event (ref Event)', 'status', 'attendance', 'feedback', 'rating', 'registeredAt', 'timestamps'],
          },
        ],
        aggregations: {
          registrationsPerEvent,
          eventsByCategory,
          eventsByStatus,
          attendanceStats,
          departmentParticipation,
          organizerStatistics,
          monthlyTrends,
          ratingDistribution,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
