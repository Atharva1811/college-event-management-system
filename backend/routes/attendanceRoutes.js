import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { updateAttendanceValidator } from '../validators/registrationValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.put(
  '/:id/attendance',
  authorize('admin', 'organizer'),
  updateAttendanceValidator,
  attendanceController.updateAttendance
);

export default router;
