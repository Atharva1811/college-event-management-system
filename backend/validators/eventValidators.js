import { check } from 'express-validator';
import { validateRequest } from './authValidators.js';

export const createEventValidator = [
  check('title', 'Title is required (minimum 3 characters, maximum 150 characters)')
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 150 }),
  check('description', 'Description is required and must be at least 10 characters long')
    .trim()
    .notEmpty()
    .isLength({ min: 10 }),
  check('category', 'Category must be one of: Technical, Cultural, Sports, Workshop, Seminar, Competition, Other')
    .isIn(['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition', 'Other']),
  check('date', 'A valid event date is required').isISO8601().toDate(),
  check('time', 'Event time is required (e.g., 10:00 AM - 04:00 PM)').trim().notEmpty(),
  check('venue', 'Venue is required and must be at least 2 characters')
    .trim()
    .notEmpty()
    .isLength({ min: 2 }),
  check('capacity', 'Capacity must be a positive whole number')
    .custom((val) => {
      const num = Number(val);
      if (!Number.isInteger(num) || num <= 0) {
        throw new Error('Capacity must be a positive whole number.');
      }
      return true;
    }),
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
  check('title', 'Title must be between 3 and 150 characters')
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 }),
  check('description', 'Description must be at least 10 characters')
    .optional()
    .trim()
    .isLength({ min: 10 }),
  check('venue', 'Venue must be at least 2 characters')
    .optional()
    .trim()
    .isLength({ min: 2 }),
  check('category', 'Invalid category')
    .optional()
    .isIn(['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Competition', 'Other']),
  check('capacity', 'Capacity must be a positive whole number')
    .optional()
    .custom((val) => {
      const num = Number(val);
      if (!Number.isInteger(num) || num <= 0) {
        throw new Error('Capacity must be a positive whole number.');
      }
      return true;
    }),
  check('status', 'Invalid event status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled']),
  validateRequest,
];
