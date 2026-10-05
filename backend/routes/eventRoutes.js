import express from 'express';
import * as eventController from '../controllers/eventController.js';
import * as feedbackController from '../controllers/feedbackController.js';
import {
  createEventValidator,
  updateEventValidator,
} from '../validators/eventValidators.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public / Authenticated read routes (optionalProtect allows organizers to see scoped departmental events)
router.get('/', optionalProtect, eventController.getEvents);
router.get('/:id', optionalProtect, eventController.getEvent);
router.get('/:eventId/feedback', feedbackController.getEventFeedback);

// Protected routes (Organizer and Admin)
router.use(protect);

router.post(
  '/',
  authorize('admin', 'organizer'),
  createEventValidator,
  eventController.createEvent
);

router.put(
  '/:id',
  authorize('admin', 'organizer'),
  updateEventValidator,
  eventController.updateEvent
);

router.patch(
  '/:id/cancel',
  authorize('admin', 'organizer'),
  eventController.cancelEvent
);

router.delete(
  '/:id',
  authorize('admin', 'organizer'),
  eventController.deleteEvent
);

export default router;
