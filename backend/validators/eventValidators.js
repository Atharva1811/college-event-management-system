import { check } from 'express-validator';
import { validateRequest } from './authValidators.js';

export const createEventValidator = [
  check('title', 'Title is required and must be under 150 characters')
    .trim()
    .notEmpty()
    .isLength({ max: 150 }),
  check('description', 'Description is required').trim().notEmpty(),
  check('category', 'Category must be one of: Technical, Cultural, Sports, Workshop, Seminar, Competition, Other')
    .isIn(['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition', 'Other']),
  check('date', 'A valid date is required').isISO8601().toDate(),
  check('time', 'Event time is required (e.g., 10:00 AM - 01:00 PM)').trim().notEmpty(),
  check('venue', 'Venue is required').trim().notEmpty(),
  check('capacity', 'Capacity must be an integer greater than 0').isInt({ min: 1 }),
  check('registrationDeadline', 'Valid registration deadline date is required')
    .isISO8601()
    .toDate()
    .custom((deadline, { req }) => {
      if (req.body.date && new Date(deadline) > new Date(req.body.date)) {
        throw new Error('Registration deadline cannot be after the event date');
      }
      return true;
    }),
  validateRequest,
];

export const updateEventValidator = [
  check('title', 'Title cannot exceed 150 characters').optional().trim().isLength({ max: 150 }),
  check('category', 'Invalid category')
    .optional()
    .isIn(['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition', 'Other']),
  check('capacity', 'Capacity must be at least 1').optional().isInt({ min: 1 }),
  check('status', 'Invalid event status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
  validateRequest,
];
