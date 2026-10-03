import express from 'express';
import * as registrationController from '../controllers/registrationController.js';
import { registerForEventValidator } from '../validators/registrationValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  authorize('student', 'admin'),
  registerForEventValidator,
  registrationController.registerForEvent
);

router.get('/my', authorize('student', 'admin'), registrationController.getMyRegistrations);
router.delete('/:id', registrationController.cancelRegistration);
router.get(
  '/event/:eventId/participants',
  authorize('admin', 'organizer'),
  registrationController.getEventParticipants
);
router.get('/', authorize('admin'), registrationController.getAllRegistrations);

export default router;
