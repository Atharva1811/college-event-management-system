import { check, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return res.status(400).json({
      success: false,
      message: errorList[0]?.message || 'Validation failed',
      errors: errorList,
    });
  }
  next();
};

export const registerValidator = [
  check('name', 'Name is required').trim().notEmpty(),
  check('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  check('role', 'Public registration is only permitted for students')
    .optional()
    .isIn(['student'])
    .withMessage('Arbitrary admin/organizer self-registration is forbidden'),
  check('department', 'Invalid department')
    .optional()
    .isIn([
      'Computer Science',
      'Information Technology',
      'AI & Data Science',
      'Electronics',
      'Mechanical',
      'Civil',
      'MBA',
      'General',
    ]),
  validateRequest,
];

export const loginValidator = [
  check('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
  check('password', 'Password is required').notEmpty(),
  validateRequest,
];
