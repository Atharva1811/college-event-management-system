import { check } from 'express-validator';
import { validateRequest } from './authValidators.js';

export const registerForEventValidator = [
  check('eventId', 'Valid Event ObjectId is required').isMongoId(),
  validateRequest,
];

export const updateAttendanceValidator = [
  check('attendance', 'Attendance must be one of: pending, present, absent')
    .isIn(['pending', 'present', 'absent']),
  validateRequest,
];

export const submitFeedbackValidator = [
  check('rating', 'Rating must be an integer between 1 and 5').isInt({ min: 1, max: 5 }),
  check('feedback', 'Feedback comment is required').trim().notEmpty(),
  validateRequest,
];
