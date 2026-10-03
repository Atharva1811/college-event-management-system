import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { submitFeedbackValidator } from '../validators/registrationValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.put(
  '/:id/feedback',
  authorize('student', 'admin'),
  submitFeedbackValidator,
  feedbackController.submitFeedback
);

export default router;
