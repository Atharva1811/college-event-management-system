import * as registrationService from '../services/registrationService.js';
import Registration from '../models/Registration.js';
import { isConnected } from '../config/db.js';

export const submitFeedback = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { rating, feedback } = req.body;
    const updated = await registrationService.submitFeedback(
      req.params.id,
      rating,
      feedback,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully! Thank you.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventFeedback = async (req, res, next) => {
  try {
    if (!isConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify MongoDB connection.',
      });
    }

    const { eventId } = req.params;
    const feedbacks = await Registration.find({
      event: eventId,
      rating: { $ne: null },
    })
      .populate('student', 'name email department avatar')
      .sort({ updatedAt: -1 });

    const total = feedbacks.length;
    const avgRating =
      total > 0
        ? Number(
            (
              feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / total
            ).toFixed(1)
          )
        : 0;

    res.status(200).json({
      success: true,
      message: 'Event feedback retrieved successfully',
      data: {
        feedbacks,
        stats: {
          totalResponses: total,
          averageRating: avgRating,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
