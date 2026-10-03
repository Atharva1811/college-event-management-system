import * as registrationService from '../services/registrationService.js';
import Registration from '../models/Registration.js';
import { isConnected } from '../config/db.js';

export const registerForEvent = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { eventId } = req.body;
    const registration = await registrationService.registerForEvent(
      req.user._id,
      eventId
    );

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event!',
      data: registration,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyRegistrations = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const registrations = await registrationService.getMyRegistrations(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Registrations retrieved successfully',
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const cancelled = await registrationService.cancelRegistration(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: 'Registration successfully cancelled.',
      data: cancelled,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventParticipants = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const participants = await registrationService.getEventParticipants(
      req.params.eventId,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Participants retrieved successfully',
      data: participants,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRegistrations = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { event, department, attendance, status, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (event) filter.event = event;
    if (attendance && attendance !== 'All') filter.attendance = attendance;
    if (status && status !== 'All') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    let query = Registration.find(filter)
      .populate('student', 'name email department phone avatar')
      .populate({
        path: 'event',
        select: 'title category date venue organizer',
        populate: { path: 'organizer', select: 'name email' },
      })
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const [registrations, total] = await Promise.all([
      query,
      Registration.countDocuments(filter),
    ]);

    // Optional filter by student department in memory if department filter passed
    let filteredRegistrations = registrations;
    if (department && department !== 'All') {
      filteredRegistrations = registrations.filter(
        (r) => r.student && r.student.department === department
      );
    }

    res.status(200).json({
      success: true,
      message: 'All registrations retrieved successfully',
      data: {
        registrations: filteredRegistrations,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
