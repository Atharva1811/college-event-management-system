import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), analyticsController.getAdminAnalytics);
router.get(
  '/organizer',
  authorize('organizer', 'admin'),
  analyticsController.getOrganizerAnalytics
);
router.get('/student', authorize('student', 'admin'), analyticsController.getStudentAnalytics);
router.get('/events/:eventId', analyticsController.getEventAnalytics);
router.get(
  '/database-insights',
  authorize('admin'),
  analyticsController.getDatabaseInsights
);

export default router;
